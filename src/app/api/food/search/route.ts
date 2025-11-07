import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

interface ExternalFoodItem {
  id: string;
  name: string;
  brand: string | null;
  serving_size: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: "openfoodfacts";
}

async function fetchOpenFoodFacts(query: string): Promise<ExternalFoodItem[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "10",
    fields:
      "code,product_name_brands,product_name,brands,serving_size,serving_quantity,nutrition_data_per,nutriments",
  });

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];

    return products
      .map((product: any) => {
        const id = product.code ? `openfoodfacts:${product.code}` : null;
        const name =
          product.product_name_brands || product.product_name || null;
        if (!id || !name) return null;

        const nutriments = product.nutriments || {};
        const perServing =
          (product.nutrition_data_per || "").toLowerCase() === "serving";
        const servingSize =
          product.serving_size ||
          (perServing
            ? `${product.serving_quantity || ""}g`.trim()
            : "per 100g");

        const calories = perServing
          ? nutriments["energy-kcal_serving"] ??
            nutriments["energy-kcal"] ??
            null
          : nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? null;
        const protein = perServing
          ? nutriments.proteins_serving
          : nutriments.proteins_100g;
        const carbs = perServing
          ? nutriments.carbohydrates_serving
          : nutriments.carbohydrates_100g;
        const fat = perServing ? nutriments.fat_serving : nutriments.fat_100g;

        return {
          id,
          name,
          brand: product.brands || null,
          serving_size: servingSize || null,
          calories: calories != null ? Number(calories) : null,
          protein: protein != null ? Number(protein) : null,
          carbs: carbs != null ? Number(carbs) : null,
          fat: fat != null ? Number(fat) : null,
          source: "openfoodfacts" as const,
        };
      })
      .filter((item: ExternalFoodItem | null): item is ExternalFoodItem =>
        Boolean(item)
      );
  } catch (error) {
    console.error("OpenFoodFacts error", error);
    return [];
  }
}

// GET /api/food/search?q=apple
export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from("food_items")
    .select("id,name,brand,serving_size,calories,protein,carbs,fat")
    .ilike("name", `%${q}%`)
    .limit(10);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  const externalItems = await fetchOpenFoodFacts(q);

  const items = [
    ...(data || []).map((item) => ({ ...item, source: "local" as const })),
    ...externalItems,
  ];

  return NextResponse.json({ items });
}
