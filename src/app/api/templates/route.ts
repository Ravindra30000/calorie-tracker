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

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit')) || 20;

  const { data, error: tErr } = await supabase
    .from('meal_templates')
    .select('*, meal_template_items(*, food_items(name, serving_size))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 400 });
  return NextResponse.json({ templates: data || [] });
}

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getAuthedSupabase(req);
  if (!supabase || !user) return error!;

  const body = await req.json();
  const mealId: string | undefined = body.meal_id;
  const name: string | undefined = body.name;
  const description: string | undefined = body.description;
  const itemsFromBody: any[] | undefined = body.items;

  let templateItems: Array<{
    food_item_id: string | null;
    custom_name: string | null;
    quantity: number;
    unit: string | null;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }> = [];

  let templateName = name;
  let totalCalories = 0;

  if (mealId) {
    const { data: meal, error: mealErr } = await supabase
      .from('meals')
      .select('id, name, total_calories, meal_items(id, food_item_id, custom_name, quantity, unit, calories, protein, carbs, fat)')
      .eq('id', mealId)
      .eq('user_id', user.id)
      .single();

    if (mealErr || !meal) {
      return NextResponse.json({ error: mealErr?.message || 'Meal not found' }, { status: 404 });
    }

    templateName = templateName || meal.name || 'Favorite Meal';
    totalCalories = Number(meal.total_calories) || 0;
    templateItems = (meal.meal_items || []).map((item: any) => ({
      food_item_id: item.food_item_id,
      custom_name: item.custom_name,
      quantity: item.quantity || 1,
      unit: item.unit || null,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));
  } else if (Array.isArray(itemsFromBody) && itemsFromBody.length) {
    templateItems = itemsFromBody.map((item) => ({
      food_item_id: item.food_item_id ?? null,
      custom_name: item.custom_name ?? null,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? null,
      calories: item.calories ?? null,
      protein: item.protein ?? null,
      carbs: item.carbs ?? null,
      fat: item.fat ?? null,
    }));
    totalCalories = templateItems.reduce((sum, item) => sum + (Number(item.calories) || 0) * (Number(item.quantity) || 1), 0);
    templateName = templateName || 'Favorite Meal';
  } else {
    return NextResponse.json({ error: 'Provide meal_id or items to create template' }, { status: 400 });
  }

  const { data: template, error: insertErr } = await supabase
    .from('meal_templates')
    .insert({
      user_id: user.id,
      name: templateName,
      description: description ?? null,
      total_calories: totalCalories,
    })
    .select()
    .single();

  if (insertErr || !template) {
    return NextResponse.json({ error: insertErr?.message || 'Failed to create template' }, { status: 400 });
  }

  if (templateItems.length) {
    const { error: itemsErr } = await supabase
      .from('meal_template_items')
      .insert(templateItems.map((item) => ({
        ...item,
        template_id: template.id,
      })));

    if (itemsErr) {
      // Clean up template if items fail to insert
      await supabase.from('meal_templates').delete().eq('id', template.id);
      return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }
  }

  const { data: fullTemplate } = await supabase
    .from('meal_templates')
    .select('*, meal_template_items(*, food_items(name, serving_size))')
    .eq('id', template.id)
    .single();

  return NextResponse.json({ template: fullTemplate });
}

