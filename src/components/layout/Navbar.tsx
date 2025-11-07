'use client';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                BiteTrack
              </span>
            </Link>
            {user && (
              <div className="ml-10 flex items-center space-x-1">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-orange-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/meals/new"
                  className="text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-orange-50"
                >
                  Log Meal
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-orange-50"
                >
                  Analytics
                </Link>
                <Link
                  href="/plans"
                  className="text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-orange-50"
                >
                  Plans
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-3">
                {profile?.premium_status === 'active' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                    {profile?.premium_plan?.includes('pro') ? 'Pro Member' : 'Premium'}
                  </span>
                ) : (
                  <Link
                    href="/plans"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold gradient-primary text-white hover:shadow-lg transition-all"
                  >
                    Upgrade
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white gradient-primary hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
