import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// GET meal items
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await params;

  // Verify meal ownership
  const { data: meal, error: checkErr } = await supabase
    .from('meals')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (checkErr || meal?.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('meal_items')
    .select('*, food_items(*)')
    .eq('meal_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

// POST - add item to meal
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Verify meal ownership
  const { data: meal, error: checkErr } = await supabase
    .from('meals')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (checkErr || meal?.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  const quantity = Number(body.quantity) || 1;
  const baseCalories = Number(body.calories) || 0;
  const baseProtein = Number(body.protein) || 0;
  const baseCarbs = Number(body.carbs) || 0;
  const baseFat = Number(body.fat) || 0;

  const { data: item, error: iErr } = await supabase
    .from('meal_items')
    .insert([{
      meal_id: id,
      food_item_id: body.food_item_id ?? null,
      custom_name: body.custom_name ?? null,
      quantity: quantity,
      unit: body.unit ?? null,
      calories: baseCalories * quantity,
      protein: baseProtein * quantity,
      carbs: baseCarbs * quantity,
      fat: baseFat * quantity,
    }])
    .select()
    .single();

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });

  // Recalculate meal total
  const { data: sumRows } = await supabase
    .from('meal_items')
    .select('calories')
    .eq('meal_id', id);

  const total = (sumRows ?? []).reduce((acc: number, r: any) => acc + (Number(r.calories) || 0), 0);
  await supabase.from('meals').update({ total_calories: total }).eq('id', id);

  return NextResponse.json({ item }, { status: 201 });
}

// DELETE - remove item from meal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');

  if (!itemId) {
    return NextResponse.json({ error: 'itemId required' }, { status: 400 });
  }

  // Verify meal ownership via item
  const { data: item, error: itemErr } = await supabase
    .from('meal_items')
    .select('meal_id, meals!inner(user_id)')
    .eq('id', itemId)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const { error: delErr } = await supabase
    .from('meal_items')
    .delete()
    .eq('id', itemId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

  // Recalculate meal total
  const { data: sumRows } = await supabase
    .from('meal_items')
    .select('calories')
    .eq('meal_id', id);

  const total = (sumRows ?? []).reduce((acc: number, r: any) => acc + (Number(r.calories) || 0), 0);
  await supabase.from('meals').update({ total_calories: total }).eq('id', id);

  return NextResponse.json({ success: true });
}

