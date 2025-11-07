import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// FREE text models on Open Router
const FREE_TEXT_MODELS = [
  'meta-llama/llama-3.1-8b-instruct',
  'mistralai/mistral-7b-instruct',
  'google/gemma-2-9b-it',
  'microsoft/phi-3-mini-128k-instruct',
];

export async function POST(req: NextRequest) {
  let supabase = await getServerSupabase();
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;
  if (token) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  }

  const { data: { user }, error: uErr } = await supabase.auth.getUser(token);
  if (uErr || !user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { text } = await req.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return NextResponse.json({ 
      error: 'Open Router API key not configured' 
    }, { status: 500 });
  }

  let textModel = process.env.OPENROUTER_TEXT_MODEL || FREE_TEXT_MODELS[0];
  if (!FREE_TEXT_MODELS.includes(textModel)) {
    textModel = FREE_TEXT_MODELS[0];
  }

  try {
    // Call Open Router to parse voice input and extract food items
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'BiteTrack',
      },
      body: JSON.stringify({
        model: textModel,
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition assistant that parses voice input about food and extracts food items with quantities and nutritional information.'
          },
          {
            role: 'user',
            content: `Parse this voice input about food: "${text}". Extract all food items mentioned with their quantities and estimated nutritional information (calories, protein in grams, carbs in grams, fat in grams). Return as JSON array: [{"name": "food name", "quantity": number or description, "serving_size": "description", "calories": number, "protein": number, "carbs": number, "fat": number}]. Be realistic with estimates.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ 
        error: error.error?.message || `Open Router API error: ${response.statusText}` 
      }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse JSON from response
    let items;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      items = JSON.parse(jsonStr);
    } catch (parseError) {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        items = JSON.parse(arrayMatch[0]);
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    // Try to match with existing food items in database
    const matchedItems = await Promise.all(
      (Array.isArray(items) ? items : [items]).map(async (item: any) => {
        const { data: existing } = await supabase
          .from('food_items')
          .select('*')
          .ilike('name', `%${item.name}%`)
          .limit(1)
          .single();

        if (existing) {
          return {
            id: existing.id,
            name: existing.name,
            serving_size: existing.serving_size,
            calories: existing.calories,
            protein: existing.protein,
            carbs: existing.carbs,
            fat: existing.fat,
            source: 'database_match',
          };
        }

        return {
          name: item.name,
          serving_size: item.serving_size || '1 serving',
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          source: 'ai_estimate',
        };
      })
    );

    return NextResponse.json({ items: matchedItems });
  } catch (error: any) {
    console.error('Voice parsing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process voice input' }, { status: 500 });
  }
}

