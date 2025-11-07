import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// FREE vision models on Open Router (confirmed free tier)
// Check https://openrouter.ai/models for latest model IDs
const FREE_VISION_MODELS = [
  'qwen/qwen-2-vl-7b-instruct',        // Default - confirmed free on Open Router
  'llava-hf/llava-v1.6-vicuna-13b-hf', // Alternative (note: v1.6 not 1.6)
  'meta-llama/llama-3.2-11b-vision-instruct', // Alternative
];

export async function POST(req: NextRequest) {
  // Handle authentication - support both cookie session and Bearer token
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

  const formData = await req.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  // Check if Open Router key is configured
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return NextResponse.json({ 
      error: 'Open Router API key not configured. Add OPENROUTER_API_KEY to your environment variables. Get a free key at https://openrouter.ai/keys' 
    }, { status: 500 });
  }

  // Use FREE vision model only - default to best free option
  let visionModel = process.env.OPENROUTER_VISION_MODEL || FREE_VISION_MODELS[0];
  
  // Ensure we're using a free model (prevent accidental paid usage)
  if (!FREE_VISION_MODELS.includes(visionModel)) {
    console.warn(`Warning: ${visionModel} is not in the free models list. Using default free model: ${FREE_VISION_MODELS[0]}`);
    visionModel = FREE_VISION_MODELS[0];
  }

  console.log(`Using vision model: ${visionModel}`);

  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Call Open Router API (compatible with OpenAI format)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'BiteTrack',
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image and identify all food items visible. For each item, estimate the serving size and provide nutritional information (calories, protein in grams, carbs in grams, fat in grams). Return a JSON array with this format: [{"name": "food name", "estimated_serving": "description", "calories": number, "protein": number, "carbs": number, "fat": number}]. Be realistic with portion sizes.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
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
    let suggestions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      suggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      // Try to extract array directly
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        suggestions = JSON.parse(arrayMatch[0]);
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    // Map suggestions to food_items format and try to match with existing items
    const matchedItems = await Promise.all(
      (Array.isArray(suggestions) ? suggestions : [suggestions]).map(async (suggestion: any) => {
        // Try to find matching food item in database
        const { data: existing } = await supabase
          .from('food_items')
          .select('*')
          .ilike('name', `%${suggestion.name}%`)
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
            estimated_serving: suggestion.estimated_serving,
            source: 'database_match',
          };
        }

        // Return AI suggestion as new item
        return {
          name: suggestion.name,
          serving_size: suggestion.estimated_serving || '1 serving',
          calories: suggestion.calories || 0,
          protein: suggestion.protein || 0,
          carbs: suggestion.carbs || 0,
          fat: suggestion.fat || 0,
          source: 'ai_suggestion',
        };
      })
    );

    return NextResponse.json({ items: matchedItems });
  } catch (error: any) {
    console.error('Food recognition error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
