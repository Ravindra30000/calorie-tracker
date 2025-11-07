'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl">
            <span className="text-white font-bold text-4xl">B</span>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-4">
            BiteTrack
          </h1>
          <p className="text-2xl text-gray-700 mb-2 font-medium">Your Calorie Tracking Companion</p>
          <p className="text-lg text-gray-600 mb-12">Track meals, monitor progress, and reach your goals</p>
          
          <div className="flex justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="px-8 py-4 text-white rounded-2xl font-semibold gradient-primary hover:shadow-2xl transition-all card-hover"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold hover:shadow-2xl transition-all card-hover border-2 border-gray-200"
            >
              Sign Up
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 card-hover animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-blue flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Track Calories</h3>
              <p className="text-gray-600">Log meals quickly and accurately with our intuitive interface</p>
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-8 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-success flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">View Analytics</h3>
              <p className="text-gray-600">See your progress over time with beautiful charts and insights</p>
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-8 card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reach Goals</h3>
              <p className="text-gray-600">Stay on track with daily targets and AI-powered suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
