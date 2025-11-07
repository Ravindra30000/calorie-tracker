import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
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
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days")) || 14;
  const limit = Number(searchParams.get("limit")) || 5;

  const fromDate = subDays(new Date(), days).toISOString();

  const { data: meals, error: mealsErr } = await supabase
    .from("meals")
    .select(
      "id, name, total_calories, meal_time, meal_items(*, food_items(name, brand))"
    )
    .eq("user_id", user.id)
    .gte("meal_time", fromDate)
    .order("meal_time", { ascending: false })
    .limit(200);

  if (mealsErr) {
    return NextResponse.json({ error: mealsErr.message }, { status: 400 });
  }

  const counts = new Map<
    string,
    {
      count: number;
      latestMeal: any;
    }
  >();

  meals?.forEach((meal) => {
    const key = (meal.name || "Untitled").trim();
    if (!counts.has(key)) {
      counts.set(key, { count: 0, latestMeal: meal });
    }
    const entry = counts.get(key)!;
    entry.count += 1;
    // keep most recent meal as template for items
    if (new Date(meal.meal_time) > new Date(entry.latestMeal.meal_time)) {
      entry.latestMeal = meal;
    }
  });

  const suggestions = Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([name, data]) => ({
      name,
      count: data.count,
      meal: data.latestMeal,
    }));

  return NextResponse.json({ suggestions });
}
