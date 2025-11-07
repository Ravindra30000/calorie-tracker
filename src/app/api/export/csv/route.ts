import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Get meals
  let q = supabase
    .from('meals')
    .select('*, meal_items(*, food_items(*))')
    .eq('user_id', user.id)
    .order('meal_time', { ascending: false });

  if (from) q = q.gte('meal_time', `${from}T00:00:00.000Z`);
  if (to) q = q.lte('meal_time', `${to}T23:59:59.999Z`);

  const { data: meals, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Generate CSV
  const csvRows = [
    ['Date', 'Time', 'Meal Name', 'Food Item', 'Quantity', 'Unit', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'].join(',')
  ];

  meals?.forEach(meal => {
    const mealDate = format(new Date(meal.meal_time), 'yyyy-MM-dd');
    const mealTime = format(new Date(meal.meal_time), 'HH:mm');
    
    if (meal.meal_items && meal.meal_items.length > 0) {
      meal.meal_items.forEach((item: any) => {
        const foodName = item.food_items?.name || item.custom_name || 'Unknown';
        csvRows.push([
          mealDate,
          mealTime,
          meal.name || 'Meal',
          `"${foodName}"`,
          item.quantity || 1,
          item.unit || '',
          item.calories || 0,
          item.protein || 0,
          item.carbs || 0,
          item.fat || 0,
        ].join(','));
      });
    } else {
      // Meal with no items
      csvRows.push([
        mealDate,
        mealTime,
        meal.name || 'Meal',
        '',
        '',
        '',
        meal.total_calories || 0,
        '',
        '',
        '',
      ].join(','));
    }
  });

  const csv = csvRows.join('\n');
  const filename = `bitetrack-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

