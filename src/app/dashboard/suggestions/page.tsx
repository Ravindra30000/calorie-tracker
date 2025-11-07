'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useMeals } from '@/hooks/useMeals';
import { format } from 'date-fns';
import Navbar from '@/components/layout/Navbar';

export default function MealSuggestionsPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: meals } = useMeals(today, today);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState('');
  const goalCalories = 2000;

  const totalCalories = meals?.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) || 0;
  const remaining = Math.max(0, goalCalories - totalCalories);

  useEffect(() => {
    if (remaining > 0) {
      loadSuggestions();
    }
  }, [remaining]);

  async function loadSuggestions() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const url = `/api/ai/suggest-meals?remaining=${remaining}${preferences ? `&preferences=${encodeURIComponent(preferences)}` : ''}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.suggestions || []);
      } else {
        console.error('Failed to load suggestions:', data.error);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (remaining <= 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">You've reached your goal!</h1>
              <p className="text-gray-600 mb-6">You've consumed {totalCalories} calories today.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Meal Suggestions</h1>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Remaining Calories</div>
              <div className="text-3xl font-bold text-blue-600">{remaining} kcal</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Preferences (optional)
              </label>
              <input
                type="text"
                value={preferences}
                onChange={e => setPreferences(e.target.value)}
                placeholder="e.g., vegetarian, low-carb, high-protein"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={loadSuggestions}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Get Suggestions'}
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-pulse text-gray-500">Generating meal suggestions...</div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{suggestion.name}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{suggestion.calories}</div>
                      <div className="text-sm text-gray-500">kcal</div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{suggestion.description}</p>
                  {suggestion.ingredients && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Ingredients:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {suggestion.ingredients.map((ing: string, i: number) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Click "Get Suggestions" to see meal ideas!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

