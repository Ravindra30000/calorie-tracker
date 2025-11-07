import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

async function getAuthedSupabase(req: NextRequest) {
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
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { supabase: null, user: null, error: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }) };
  }
  return { supabase, user };
}

const FREE_TEXT_MODELS = [
  'meta-llama/llama-3.1-8b-instruct',
  'mistralai/mistral-7b-instruct',
  'google/gemma-2-9b-it',
  'microsoft/phi-3-mini-128k-instruct',
];

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getAuthedSupabase(req);
  if (!supabase || !user) return error!;

  const { text } = await req.json();
  const cleaned = (text || '').trim();
  if (!cleaned) {
    return NextResponse.json({ error: 'Please provide a description.' }, { status: 400 });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return NextResponse.json({ error: 'Open Router API key not configured.' }, { status: 500 });
  }

  let textModel = process.env.OPENROUTER_TEXT_MODEL || FREE_TEXT_MODELS[0];
  if (!FREE_TEXT_MODELS.includes(textModel)) {
    textModel = FREE_TEXT_MODELS[0];
  }

  try {
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
            content: 'You are a nutrition assistant that parses free text meal descriptions into food items with nutrition data.'
          },
          {
            role: 'user',
            content: `Parse this meal description: "${cleaned}". Extract each distinct food item with amount. Return JSON array [{"name":"food name","serving_size":"description","quantity":number,"calories":number,"protein":number,"carbs":number,"fat":number}]. Use realistic estimates.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json({ error: err.error?.message || 'AI parsing failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI.' }, { status: 500 });
    }

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
        return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 500 });
      }
    }

    const normalized = (Array.isArray(items) ? items : [items])
      .map((item: any, idx: number) => ({
        id: `ai:${idx}`,
        name: item.name || 'Meal Item',
        serving_size: item.serving_size || null,
        calories: item.calories != null ? Number(item.calories) : null,
        protein: item.protein != null ? Number(item.protein) : null,
        carbs: item.carbs != null ? Number(item.carbs) : null,
        fat: item.fat != null ? Number(item.fat) : null,
        quantity: item.quantity != null ? Number(item.quantity) : 1,
        source: 'ai',
      }))
      .filter((item: any) => item.name);

    return NextResponse.json({ items: normalized });
  } catch (e: any) {
    console.error('AI parse text error', e);
    return NextResponse.json({ error: e.message || 'Failed to parse meal' }, { status: 500 });
  }
}

