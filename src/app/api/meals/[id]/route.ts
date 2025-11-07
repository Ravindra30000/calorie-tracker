import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } = await supabase.auth.getUser();
  if (uErr || !user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Verify ownership
  const { data: meal, error: checkErr } = await supabase
    .from("meals")
    .select("user_id")
    .eq("id", id)
    .single();

  if (checkErr || meal?.user_id !== user.id) {
    return NextResponse.json(
      { error: "Not found or unauthorized" },
      { status: 404 }
    );
  }

  const { error } = await supabase.from("meals").update(body).eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  // Verify ownership
  const { data: meal, error: checkErr } = await supabase
    .from("meals")
    .select("user_id")
    .eq("id", id)
    .single();

  if (checkErr || meal?.user_id !== user.id) {
    return NextResponse.json(
      { error: "Not found or unauthorized" },
      { status: 404 }
    );
  }

  // Delete meal_items first (cascade might not be set up)
  await supabase.from("meal_items").delete().eq("meal_id", id);

  const { error } = await supabase.from("meals").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
