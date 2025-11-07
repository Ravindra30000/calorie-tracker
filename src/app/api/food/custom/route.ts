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

export async function GET(req: NextRequest) {
  const { supabase, user, error } = await getAuthedSupabase(req);
  if (!supabase || !user) return error!;

  const { data, error: fetchErr } = await supabase
    .from('food_items')
    .select('id, name, brand, serving_size, calories, protein, carbs, fat, created_at, updated_at')
    .eq('created_by', user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 400 });
  }

  const items = (data || []).map(item => ({ ...item, source: 'custom' as const }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getAuthedSupabase(req);
  if (!supabase || !user) return error!;

  const body = await req.json();
  const { name, brand, serving_size, calories, protein, carbs, fat } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const { data, error: insertErr } = await supabase
    .from('food_items')
    .insert({
      name,
      brand: brand ?? null,
      serving_size: serving_size ?? null,
      calories: calories != null ? Number(calories) : null,
      protein: protein != null ? Number(protein) : null,
      carbs: carbs != null ? Number(carbs) : null,
      fat: fat != null ? Number(fat) : null,
      created_by: user.id,
    })
    .select('id, name, brand, serving_size, calories, protein, carbs, fat, created_at, updated_at')
    .single();

  if (insertErr || !data) {
    return NextResponse.json({ error: insertErr?.message || 'Failed to create food item' }, { status: 400 });
  }

  return NextResponse.json({ item: { ...data, source: 'custom' as const } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, error } = await getAuthedSupabase(req);
  if (!supabase || !user) return error!;

  const body = await req.json();
  const { id, name, brand, serving_size, calories, protein, carbs, fat } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required for update.' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (brand !== undefined) updates.brand = brand;
  if (serving_size !== undefined) updates.serving_size = serving_size;
  if (calories !== undefined) updates.calories = calories != null ? Number(calories) : null;
  if (protein !== undefined) updates.protein = protein != null ? Number(protein) : null;
  if (carbs !== undefined) updates.carbs = carbs != null ? Number(carbs) : null;
  if (fat !== undefined) updates.fat = fat != null ? Number(fat) : null;

  const { data, error: updateErr } = await supabase
    .from('food_items')
    .update(updates)
    .eq('id', id)
    .eq('created_by', user.id)
    .select('id, name, brand, serving_size, calories, protein, carbs, fat, created_at, updated_at')
    .single();

  if (updateErr || !data) {
    return NextResponse.json({ error: updateErr?.message || 'Failed to update food item' }, { status: 400 });
  }

  return NextResponse.json({ item: { ...data, source: 'custom' as const } });
}

