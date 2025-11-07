import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(new URL('/login', req.url));
}

