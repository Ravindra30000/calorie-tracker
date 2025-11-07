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

  const { data, error: subErr } = await supabase
    .from('subscriptions')
    .select('*, subscription_plans(code, name, price_cents, interval)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 400 });
  }

  return NextResponse.json({ subscription: data?.[0] ?? null });
}

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getAuthedSupabase(req);
  if (!supabase || !user) return error!;

  const body = await req.json();
  const { plan_code } = body;
  if (!plan_code) {
    return NextResponse.json({ error: 'plan_code is required' }, { status: 400 });
  }

  const { data: plan, error: planErr } = await supabase
    .from('subscription_plans')
    .select('id, code, interval')
    .eq('code', plan_code)
    .eq('is_active', true)
    .single();

  if (planErr || !plan) {
    return NextResponse.json({ error: planErr?.message || 'Plan not found' }, { status: 404 });
  }

  const now = new Date();
  const expires = new Date(now);
  if (plan.interval === 'monthly') {
    expires.setMonth(expires.getMonth() + 1);
  } else if (plan.interval === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1);
  }

  const { data: sub, error: insertErr } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      provider: 'internal',
      status: 'active',
      started_at: now.toISOString(),
      expires_at: plan.interval === 'lifetime' ? null : expires.toISOString(),
    })
    .select()
    .single();

  if (insertErr || !sub) {
    return NextResponse.json({ error: insertErr?.message || 'Failed to create subscription' }, { status: 400 });
  }

  await supabase
    .from('profiles')
    .update({
      premium_plan: plan.code,
      premium_status: 'active',
      premium_since: now.toISOString(),
    })
    .eq('id', user.id);

  return NextResponse.json({ subscription: sub }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user, error } = await getAuthedSupabase(req);
  if (!supabase || !user) return error!;

  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subErr || !sub) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
  }

  const now = new Date().toISOString();

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancel_at: now })
    .eq('id', sub.id);

  await supabase
    .from('profiles')
    .update({ premium_plan: 'free', premium_status: 'inactive' })
    .eq('id', user.id);

  return NextResponse.json({ success: true });
}

