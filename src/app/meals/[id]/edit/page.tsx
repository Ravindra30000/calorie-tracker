'use client';
import { useParams, useRouter } from 'next/navigation';
import { useMeals } from '@/hooks/useMeals';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/layout/Navbar';

export default function EditMealPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = params.id as string;
  const { data: meals } = useMeals();
  const meal = meals?.find((m) => m.id === mealId);

  const [name, setName] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (meal) {
      setName(meal.name || '');
      setMealTime(new Date(meal.meal_time).toISOString().slice(0, 16));
      loadMealItems();
    }
  }, [meal]);

  async function loadMealItems() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch(`/api/meals/${mealId}/items`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function searchFood() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }

  function addItem(foodItem: any) {
    setItems(prev => [...prev, { ...foodItem, quantity: 1, unit: foodItem.serving_size ?? 'serving' }]);
    setQuery('');
    setSearchResults([]);
  }

  function removeItem(itemId: string) {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }

  function updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) return;
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  }

  async function saveMeal() {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      // Update meal
      await fetch(`/api/meals/${mealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          name,
          meal_time: new Date(mealTime).toISOString(),
        }),
      });

      // Delete all existing items
      for (const item of items.filter(i => i.id)) {
        await fetch(`/api/meals/${mealId}/items?itemId=${item.id}`, {
          method: 'DELETE',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
      }

      // Add all items (including new ones)
      for (const item of items) {
        await fetch(`/api/meals/${mealId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            food_item_id: item.food_item_id || item.id,
            quantity: item.quantity || 1,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          }),
        });
      }

      router.push(`/meals/${mealId}`);
    } catch (error) {
      alert('Failed to save meal');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading meal...</div>
        </div>
      </>
    );
  }

  if (!meal) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Meal not found</h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const totalCalories = items.reduce((sum, item) => {
    const baseCal = Number(item.calories) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (baseCal * qty);
  }, 0);

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

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Meal</h1>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={mealTime}
                  onChange={e => setMealTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Food Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Food Item</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for food items..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchFood()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={searchFood}
                  disabled={searching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => addItem(it)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{it.name}</div>
                          <div className="text-sm text-gray-600">
                            {it.calories} kcal {it.serving_size && `per ${it.serving_size}`}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Meal Items</h2>
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={it.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{it.name || it.food_items?.name}</div>
                      <div className="text-sm text-gray-600">
                        {(Number(it.calories) || 0) * (Number(it.quantity) || 1)} kcal
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{it.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(it.id || idx.toString())}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total Calories</span>
                  <span className="text-2xl font-bold text-blue-600">{totalCalories} kcal</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={saveMeal}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

