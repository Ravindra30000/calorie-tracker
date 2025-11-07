'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/layout/Navbar';

export default function RecurringMealPage() {
  const router = useRouter();
  const [name, setName] = useState('Breakfast');
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [time, setTime] = useState('08:00');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      setResults(j.items || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  function addItem(it: any) {
    setItems(prev => [...prev, { ...it, quantity: 1, unit: it.serving_size ?? 'serving' }]);
    setQuery('');
    setResults([]);
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) return;
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  }

  function toggleDay(dayIndex: number) {
    setDaysOfWeek(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  }

  async function saveRecurring() {
    if (items.length === 0) return;
    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      alert('Please select at least one day of the week');
      return;
    }

    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      // Create meals for the next 30 days based on frequency
      const mealsToCreate = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay();

        let shouldCreate = false;
        if (frequency === 'daily') {
          shouldCreate = true;
        } else if (frequency === 'weekly' && daysOfWeek.includes(dayOfWeek)) {
          shouldCreate = true;
        }

        if (shouldCreate) {
          const [hours, minutes] = time.split(':');
          const mealTime = new Date(date);
          mealTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          mealsToCreate.push({
            name,
            meal_time: mealTime.toISOString(),
            items: items.map(it => ({
              food_item_id: it.id,
              custom_name: null,
              quantity: it.quantity,
              unit: it.unit,
              calories: it.calories,
              protein: it.protein,
              carbs: it.carbs,
              fat: it.fat
            }))
          });
        }
      }

      // Create meals in batches
      for (const meal of mealsToCreate) {
        const r = await fetch('/api/meals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(meal)
        });
        if (!r.ok) {
          const j = await r.json();
          throw new Error(j.error || 'Failed to create meal');
        }
      }

      alert(`Created ${mealsToCreate.length} recurring meals!`);
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Failed to create recurring meals');
    } finally {
      setSaving(false);
    }
  }

  const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0) * (item.quantity || 1), 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Create Recurring Meal</h1>

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Breakfast, Lunch, Dinner..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFrequency('daily')}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      frequency === 'daily'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setFrequency('weekly')}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      frequency === 'weekly'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Days of Week</label>
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                          daysOfWeek.includes(idx)
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Food Search */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Food</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search for food items..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={search}
                disabled={loading}
                className="px-8 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="mt-4 border-2 border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                {results.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => addItem(it)}
                    className="w-full text-left px-4 py-4 hover:bg-orange-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">{it.name}</div>
                        <div className="text-sm text-orange-600 font-medium">
                          {it.calories} kcal {it.serving_size && `per ${it.serving_size}`}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Items */}
          {items.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Meal Items</h2>
              <div className="space-y-4">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-white rounded-2xl border-2 border-orange-100">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">{it.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {(Number(it.calories) || 0) * (Number(it.quantity) || 1)} kcal
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-white rounded-xl p-2 border-2 border-gray-200">
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) - 1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{it.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) + 1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-700">Total Calories</span>
                  <span className="text-4xl font-bold text-orange-600">{totalCalories} kcal</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={saveRecurring}
              disabled={!items.length || saving}
              className="flex-1 px-8 py-4 gradient-primary text-white rounded-2xl font-bold hover:shadow-2xl disabled:opacity-50 transition-all text-lg"
            >
              {saving ? 'Creating...' : `Create ${frequency === 'daily' ? '30 Daily' : `${daysOfWeek.length} Weekly`} Meals`}
            </button>
            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

