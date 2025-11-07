import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('code, name, description, price_cents, interval, features')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ plans: data || [] });
}

