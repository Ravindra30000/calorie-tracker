import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

// GET /api/meals?from=2025-01-01&to=2025-01-31
export async function GET(req: NextRequest) {
  // Prefer cookie session, but if a Bearer token is provided, bind it to the client
  let supabase = await getServerSupabase();
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  if (token) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  }

  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser(token);
  if (uErr || !user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let q = supabase
    .from("meals")
    .select("*, meal_items(protein, carbs, fat)")
    .eq("user_id", user.id)
    .order("meal_time", { ascending: false });
  if (from) q = q.gte("meal_time", `${from}T00:00:00.000Z`);
  if (to) q = q.lte("meal_time", `${to}T23:59:59.999Z`);

  const { data, error } = await q;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ meals: data });
}

// POST /api/meals
// body: { name?: string, meal_time: string, items?: Array<{ food_item_id?: string, custom_name?: string, quantity?: number, unit?: string, calories?: number, protein?: number, carbs?: number, fat?: number }> }
export async function POST(req: NextRequest) {
  let supabase = await getServerSupabase();
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  if (token) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  }

  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser(token);
  if (uErr || !user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json();

  const { data: meal, error: mErr } = await supabase
    .from("meals")
    .insert([
      { user_id: user.id, name: body.name ?? null, meal_time: body.meal_time },
    ])
    .select("*")
    .single();
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

  if (Array.isArray(body.items) && body.items.length) {
    const itemsToInsert = body.items.map((it: any) => {
      const quantity = Number(it.quantity) || 1;
      const baseCalories = Number(it.calories) || 0;
      const baseProtein = Number(it.protein) || 0;
      const baseCarbs = Number(it.carbs) || 0;
      const baseFat = Number(it.fat) || 0;

      return {
        meal_id: meal.id,
        food_item_id: it.food_item_id ?? null,
        custom_name: it.custom_name ?? null,
        quantity: quantity,
        unit: it.unit ?? null,
        calories: baseCalories * quantity, // Multiply by quantity
        protein: baseProtein * quantity,
        carbs: baseCarbs * quantity,
        fat: baseFat * quantity,
      };
    });
    const { error: iErr } = await supabase
      .from("meal_items")
      .insert(itemsToInsert);
    if (iErr)
      return NextResponse.json({ error: iErr.message }, { status: 400 });
  }

  const { data: sumRows, error: sErr } = await supabase
    .from("meal_items")
    .select("calories")
    .eq("meal_id", meal.id);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });

  const total = (sumRows ?? []).reduce(
    (acc: number, r: any) => acc + (Number(r.calories) || 0),
    0
  );
  const { error: upErr } = await supabase
    .from("meals")
    .update({ total_calories: total })
    .eq("id", meal.id);
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 400 });

  return NextResponse.json(
    { meal: { ...meal, total_calories: total } },
    { status: 201 }
  );
}
