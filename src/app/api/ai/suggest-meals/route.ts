import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// FREE text models on Open Router (confirmed free tier)
const FREE_TEXT_MODELS = [
  'meta-llama/llama-3.1-8b-instruct',      // Default - best free text model
  'mistralai/mistral-7b-instruct',         // Alternative free option
  'google/gemma-2-9b-it',                   // Alternative free option
  'microsoft/phi-3-mini-128k-instruct',     // Alternative free option
];

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const remainingCalories = parseInt(searchParams.get('remaining') || '500');
  const preferences = searchParams.get('preferences') || '';

  // Check if Open Router key is configured
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return NextResponse.json({ 
      error: 'Open Router API key not configured. Add OPENROUTER_API_KEY to your environment variables. Get a free key at https://openrouter.ai/keys' 
    }, { status: 500 });
  }

  // Use FREE text model only - default to best free option
  let textModel = process.env.OPENROUTER_TEXT_MODEL || FREE_TEXT_MODELS[0];
  
  // Ensure we're using a free model (prevent accidental paid usage)
  if (!FREE_TEXT_MODELS.includes(textModel)) {
    console.warn(`Warning: ${textModel} is not in the free models list. Using default free model: ${FREE_TEXT_MODELS[0]}`);
    textModel = FREE_TEXT_MODELS[0];
  }

  try {
    // Get user's today's meals to understand context
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMeals } = await supabase
      .from('meals')
      .select('total_calories')
      .eq('user_id', user.id)
      .gte('meal_time', `${today}T00:00:00.000Z`)
      .lte('meal_time', `${today}T23:59:59.999Z`);

    const consumed = todayMeals?.reduce((sum, m) => sum + (Number(m.total_calories) || 0), 0) || 0;

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
        model: textModel,
        messages: [
          {
            role: 'system',
            content: 'You are a nutritionist helping users find healthy meal options that fit their calorie budget.'
          },
          {
            role: 'user',
            content: `Suggest 3 meal options that are approximately ${remainingCalories} calories. ${preferences ? `User preferences: ${preferences}.` : ''} For each meal, provide: name, brief description, estimated calories, and a simple list of main ingredients. Return as JSON array: [{"name": "meal name", "description": "brief description", "calories": number, "ingredients": ["ingredient1", "ingredient2"]}].`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
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
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      suggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        suggestions = JSON.parse(arrayMatch[0]);
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    return NextResponse.json({ suggestions: Array.isArray(suggestions) ? suggestions : [suggestions] });
  } catch (error: any) {
    console.error('Meal suggestion error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 });
  }
}
