import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

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

  // Get original meal
  const { data: originalMeal, error: mealErr } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (mealErr || !originalMeal) {
    return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  }

  // Get meal items
  const { data: originalItems, error: itemsErr } = await supabase
    .from('meal_items')
    .select('*')
    .eq('meal_id', id);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 400 });
  }

  // Create new meal with current timestamp
  const { data: newMeal, error: newMealErr } = await supabase
    .from('meals')
    .insert([{
      user_id: user.id,
      name: `${originalMeal.name || 'Meal'} (Copy)`,
      meal_time: new Date().toISOString(),
      notes: originalMeal.notes,
      total_calories: 0,
    }])
    .select()
    .single();

  if (newMealErr || !newMeal) {
    return NextResponse.json({ error: newMealErr?.message || 'Failed to create meal' }, { status: 400 });
  }

  // Duplicate items
  if (originalItems && originalItems.length > 0) {
    const itemsToInsert = originalItems.map(item => ({
      meal_id: newMeal.id,
      food_item_id: item.food_item_id,
      custom_name: item.custom_name,
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));

    const { error: insertErr } = await supabase
      .from('meal_items')
      .insert(itemsToInsert);

    if (insertErr) {
      // Clean up meal if items fail
      await supabase.from('meals').delete().eq('id', newMeal.id);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // Recalculate total
    const total = itemsToInsert.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    await supabase.from('meals').update({ total_calories: total }).eq('id', newMeal.id);
    newMeal.total_calories = total;
  }

  return NextResponse.json({ meal: newMeal }, { status: 201 });
}

