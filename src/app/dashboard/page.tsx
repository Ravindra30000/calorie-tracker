'use client';
import { useMeals } from '@/hooks/useMeals';
import { useUser } from '@/hooks/useUser';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: meals, isLoading } = useMeals(today, today);

  // Redirect to onboarding if profile is incomplete
  useEffect(() => {
    if (user && !profileLoading && !profile) {
      router.push('/onboarding');
    }
  }, [user, profile, profileLoading, router]);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to BiteTrack</h1>
            <p className="text-gray-600 mb-6">Please log in to view your dashboard.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 text-white rounded-xl font-medium gradient-primary hover:shadow-lg transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </>
    );
  }

  const totalCalories = meals?.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) || 0;
  const goalCalories = profile?.calorie_goal || 2000;
  const remaining = Math.max(0, goalCalories - totalCalories);
  const percentage = Math.min((totalCalories / goalCalories) * 100, 100);

  if (profileLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Today's Meals</h1>
            <p className="text-gray-600 text-lg">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>

          {/* Main Stats Card - Large Circular Progress */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 card-hover animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex-1 mb-6 md:mb-0">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Calories Today</div>
                <div className="flex items-baseline space-x-2 mb-4">
                  <span className="text-6xl font-bold text-gray-900">{totalCalories}</span>
                  <span className="text-2xl text-gray-500">/ {goalCalories}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {remaining > 0 ? (
                    <span className="text-green-600 font-semibold">{remaining} calories remaining</span>
                  ) : (
                    <span className="text-orange-600 font-semibold">Goal reached! 🎉</span>
                  )}
                </div>
              </div>
              
              {/* Circular Progress */}
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-100"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
                    className="text-orange-500 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{Math.round(percentage)}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Banner */}
          {profile?.premium_status !== 'active' && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl shadow-xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Unlock BiteTrack Pro</h2>
                  <p className="text-white/80 mt-1">Get AI meal planning, advanced insights, and smart coaching reminders.</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/plans"
                    className="px-6 py-3 bg-white text-orange-600 rounded-2xl font-semibold hover:shadow-lg transition-all"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Macros Summary */}
          {meals && meals.length > 0 && (() => {
            const macros = meals.reduce((acc, meal) => {
              if (meal.meal_items && Array.isArray(meal.meal_items)) {
                meal.meal_items.forEach((item: any) => {
                  acc.protein += Number(item.protein) || 0;
                  acc.carbs += Number(item.carbs) || 0;
                  acc.fat += Number(item.fat) || 0;
                });
              }
              return acc;
            }, { protein: 0, carbs: 0, fat: 0 });

            return (
              <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 card-hover animate-fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Macros Today</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Protein</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(macros.protein)}g
                    </div>
                    {profile?.protein_goal && (
                      <div className="text-xs text-gray-500 mt-1">
                        of {profile.protein_goal}g goal
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Carbs</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(macros.carbs)}g
                    </div>
                    {profile?.carbs_goal && (
                      <div className="text-xs text-gray-500 mt-1">
                        of {profile.carbs_goal}g goal
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Fat</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(macros.fat)}g
                    </div>
                    {profile?.fat_goal && (
                      <div className="text-xs text-gray-500 mt-1">
                        of {profile.fat_goal}g goal
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium opacity-90">Meals Today</div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold">{meals?.length || 0}</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium opacity-90">Remaining</div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold">{remaining}</div>
              <div className="text-sm opacity-90 mt-1">calories left</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium opacity-90">Average</div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold">{meals?.length ? Math.round(totalCalories / meals.length) : 0}</div>
              <div className="text-sm opacity-90 mt-1">per meal</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-wrap gap-4">
            <Link
              href="/meals/new"
              className="flex-1 min-w-[200px] inline-flex items-center justify-center px-6 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all card-hover text-orange-600 font-semibold"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Log Meal
            </Link>
            <Link
              href="/meals/new/with-image"
              className="flex-1 min-w-[200px] inline-flex items-center justify-center px-6 py-4 gradient-green rounded-2xl shadow-lg hover:shadow-xl transition-all card-hover text-white font-semibold"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Photo Meal
            </Link>
            <Link
              href="/meals/new/with-voice"
              className="flex-1 min-w-[200px] inline-flex items-center justify-center px-6 py-4 gradient-blue rounded-2xl shadow-lg hover:shadow-xl transition-all card-hover text-white font-semibold"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Meal
            </Link>
            <Link
              href="/meals/new/recurring"
              className="flex-1 min-w-[200px] inline-flex items-center justify-center px-6 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all card-hover text-orange-600 font-semibold border-2 border-orange-200"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recurring
            </Link>
            {remaining > 0 && (
              <Link
                href="/dashboard/suggestions"
                className="flex-1 min-w-[200px] inline-flex items-center justify-center px-6 py-4 gradient-purple rounded-2xl shadow-lg hover:shadow-xl transition-all card-hover text-white font-semibold"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Get Suggestions
              </Link>
            )}
          </div>

          {/* Meals List */}
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-pulse text-gray-500">Loading meals...</div>
            </div>
          ) : meals && meals.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Meals</h2>
              {meals.map((meal, index) => (
                <div
                  key={meal.id}
                  className="bg-white rounded-2xl shadow-lg p-6 card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
                          {meal.name?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{meal.name || 'Meal'}</h3>
                          <p className="text-gray-500 text-sm">{format(new Date(meal.meal_time), 'h:mm a')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">{meal.total_calories || 0}</div>
                      <div className="text-sm text-gray-500">kcal</div>
                    </div>
                  </div>
                  <Link
                    href={`/meals/${meal.id}`}
                    className="mt-4 inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No meals logged today</h3>
              <p className="text-gray-600 mb-6">Get started by logging your first meal!</p>
              <Link
                href="/meals/new"
                className="inline-flex items-center px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Log Your First Meal
              </Link>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 flex gap-6">
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
            >
              View Analytics
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/dashboard/share"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
            >
              Share Progress
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4m0 0L8 6m4-4v13" />
              </svg>
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center text-gray-600 hover:text-gray-700 font-semibold"
            >
              Settings & Export
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
