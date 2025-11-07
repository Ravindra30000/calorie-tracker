'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/layout/Navbar';
import { useMealTemplates, useFrequentMeals, useCustomFoods, useSaveCustomFood } from '@/hooks/useTemplates';
import { useProfile } from '@/hooks/useProfile';

export default function NewMealPage() {
  const router = useRouter();
  const [name, setName] = useState('Lunch');
  const [mealTime, setMealTime] = useState(new Date().toISOString());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'search' | 'ai'>('search');
  const [aiText, setAiText] = useState('');
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: templatesData } = useMealTemplates();
  const { data: frequentData } = useFrequentMeals();
  const { data: customData } = useCustomFoods();
  const saveCustomFood = useSaveCustomFood();
  const { data: profile } = useProfile();

  const templates = templatesData?.templates || [];
  const frequent = frequentData?.suggestions || [];
  const customFoods = customData?.items || [];
  const isPro = profile?.premium_status === 'active';

  const initialCustomForm = {
    id: null as string | null,
    name: '',
    brand: '',
    serving_size: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState(initialCustomForm);
  const [customSaving, setCustomSaving] = useState(false);

  function normalizeSearchItem(item: any) {
    return {
      id: item.id,
      name: item.name,
      brand: item.brand ?? null,
      source: item.source || 'local',
      serving_size: item.serving_size ?? null,
      calories: item.calories != null ? Number(item.calories) : null,
      protein: item.protein != null ? Number(item.protein) : null,
      carbs: item.carbs != null ? Number(item.carbs) : null,
      fat: item.fat != null ? Number(item.fat) : null,
      quantity: 1,
      unit: item.serving_size ?? 'serving',
    };
  }

  function applyTemplate(template: any) {
    const tplItems = (template.meal_template_items || template.items || []).map((item: any) => ({
      id: item.id,
      name: item.custom_name || item.food_items?.name || template.name,
      food_item_id: item.food_item_id || null,
      quantity: item.quantity || 1,
      unit: item.unit || 'serving',
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      brand: item.food_items?.brand ?? null,
      source: 'local',
    }));
    if (!tplItems.length) {
      alert('Template has no items to use.');
      return;
    }
    setItems(tplItems);
    setName(template.name || name);
  }

  function addSuggestion(suggestion: any) {
    const meal = suggestion.meal;
    if (!meal || !meal.meal_items?.length) return;
    const suggestionItems = meal.meal_items.map((item: any) => ({
      id: item.id,
      name: item.custom_name || item.food_items?.name || suggestion.name,
      food_item_id: item.food_item_id || null,
      quantity: item.quantity || 1,
      unit: item.unit || 'serving',
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      brand: item.food_items?.brand ?? null,
      source: 'local',
    }));
    setItems(prev => [...prev, ...suggestionItems]);
    if (!name) setName(suggestion.name);
  }

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

  async function parseAiDescription() {
    if (!aiText.trim()) {
      alert('Please describe your meal first.');
      return;
    }
    setAiLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch('/api/ai/parse-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to parse meal');
        return;
      }
      setAiResults(data.items || []);
    } catch (error) {
      console.error('AI parse error', error);
      alert('Failed to parse meal description.');
    } finally {
      setAiLoading(false);
    }
  }

  function addItem(it: any) {
    setItems(prev => [...prev, normalizeSearchItem(it)]);
    setQuery('');
    setResults([]);
  }

  function addAiResult(it: any) {
    setItems(prev => [...prev, normalizeSearchItem(it)]);
  }

  function addAllAiResults() {
    if (!aiResults.length) return;
    setItems(prev => [...prev, ...aiResults.map(normalizeSearchItem)]);
  }

  function updateCustomField(field: keyof typeof customForm, value: string) {
    setCustomForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSaveCustomFood() {
    if (!customForm.name.trim()) {
      alert('Name is required');
      return;
    }
    setCustomSaving(true);
    try {
      const payload = {
        id: customForm.id || undefined,
        name: customForm.name.trim(),
        brand: customForm.brand?.trim() || null,
        serving_size: customForm.serving_size?.trim() || null,
        calories: customForm.calories !== '' ? Number(customForm.calories) : null,
        protein: customForm.protein !== '' ? Number(customForm.protein) : null,
        carbs: customForm.carbs !== '' ? Number(customForm.carbs) : null,
        fat: customForm.fat !== '' ? Number(customForm.fat) : null,
      };

      const result = await saveCustomFood.mutateAsync(payload);
      const createdItem = result?.item;
      if (createdItem && !customForm.id) {
        setItems(prev => [...prev, normalizeSearchItem(createdItem)]);
      }
      setShowCustomModal(false);
      setCustomForm(initialCustomForm);
    } catch (error: any) {
      alert(error.message || 'Failed to save food');
    } finally {
      setCustomSaving(false);
    }
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

  async function submit() {
    if (items.length === 0) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const body = {
        name,
        meal_time: mealTime,
        items: items.map(it => ({
          food_item_id: ['local', 'custom'].includes(it.source) ? it.id : null,
          custom_name: ['local', 'custom'].includes(it.source) ? null : it.name,
          quantity: it.quantity,
          unit: it.unit,
          calories: it.calories,
          protein: it.protein,
          carbs: it.carbs,
          fat: it.fat
        }))
      };
      const r = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if (r.ok) {
        router.push('/dashboard');
      } else {
        alert(j.error || 'Failed to create meal');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const totalCalories = items.reduce((sum, item) => sum + (Number(item.calories) || 0) * (Number(item.quantity) || 1), 0);

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

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Log Meal</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Favorites</h2>
                {templates.length > 0 && (
                  <span className="text-sm text-gray-500">{templates.length} saved</span>
                )}
              </div>
              {templates.length ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {templates.map((tpl: any) => (
                    <div key={tpl.id} className="p-4 border-2 border-orange-100 rounded-2xl bg-orange-50/40">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{tpl.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{Math.round(tpl.total_calories || 0)} kcal</div>
                        </div>
                        <button
                          onClick={() => applyTemplate(tpl)}
                          className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Save meals as favorites to quickly reuse them here.</p>
              )}
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-6 card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Frequent Meals</h2>
                {frequent.length > 0 && (
                  <span className="text-sm text-gray-500">Last 14 days</span>
                )}
              </div>
              {frequent.length ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {frequent.map((suggestion: any) => (
                    <div key={suggestion.name} className="p-4 border-2 border-blue-100 rounded-2xl bg-blue-50/40">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{suggestion.name}</div>
                          <div className="text-xs text-gray-500 mt-1">Logged {suggestion.count} times</div>
                        </div>
                        <button
                          onClick={() => addSuggestion(suggestion)}
                          className="px-4 py-2 bg-white text-blue-600 border-2 border-blue-200 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Log meals regularly to see smart suggestions.</p>
              )}
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-6 card-hover animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Custom Foods</h2>
                <button
                  onClick={() => {
                    setCustomForm(initialCustomForm);
                    setShowCustomModal(true);
                  }}
                  className="px-3 py-1.5 bg-white text-orange-600 border-2 border-orange-200 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                >
                  Add New
                </button>
              </div>
              {customFoods.length ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {customFoods.map((food: any) => (
                    <div key={food.id} className="p-4 border-2 border-purple-100 rounded-2xl bg-purple-50/40">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{food.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{Math.round(food.calories || 0)} kcal • {food.serving_size || 'per serving'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCustomForm({
                                id: food.id,
                                name: food.name || '',
                                brand: food.brand || '',
                                serving_size: food.serving_size || '',
                                calories: food.calories != null ? String(food.calories) : '',
                                protein: food.protein != null ? String(food.protein) : '',
                                carbs: food.carbs != null ? String(food.carbs) : '',
                                fat: food.fat != null ? String(food.fat) : '',
                              });
                              setShowCustomModal(true);
                            }}
                            className="px-3 py-1 bg-white text-gray-600 border-2 border-gray-200 rounded-xl text-xs font-semibold hover:shadow-lg transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => addItem({ ...food, source: 'custom' })}
                            className="px-3 py-1 gradient-primary text-white rounded-xl text-xs font-semibold hover:shadow-lg transition-all"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Create your own foods to reuse them quickly.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Breakfast, Lunch, Dinner..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={new Date(mealTime).toISOString().slice(0, 16)}
                  onChange={e => setMealTime(new Date(e.target.value).toISOString())}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setMode('search')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  mode === 'search' ? 'gradient-primary text-white shadow-lg' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Search Food
              </button>
              <button
                onClick={() => isPro ? setMode('ai') : alert('Upgrade to BiteTrack Pro for AI meal parsing.')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  mode === 'ai'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700'
                } ${!isPro ? 'opacity-70 cursor-not-allowed hover:shadow-none' : ''}`}
                disabled={!isPro}
              >
                Describe Meal (AI)
              </button>
            </div>

            {mode === 'search' || !isPro ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Food</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Search for food items..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <span>{it.name}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                it.source === 'openfoodfacts'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {it.source === 'openfoodfacts' ? 'OpenFoodFacts' : 'Local'}
                              </span>
                            </div>
                            {it.brand && <div className="text-sm text-gray-500">{it.brand}</div>}
                            <div className="text-sm text-orange-600 font-medium">
                              {it.calories != null ? `${Math.round(it.calories)} kcal` : 'Calories NA'}
                              {it.serving_size && ` • ${it.serving_size}`}
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
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Describe your meal</label>
                <textarea
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  placeholder="e.g. I ate two scrambled eggs with spinach and a slice of wholegrain toast"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all min-h-[120px]"
                />
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={parseAiDescription}
                    disabled={aiLoading}
                    className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {aiLoading ? 'Analyzing...' : 'Analyze Meal'}
                  </button>
                  {aiResults.length > 0 && (
                    <button
                      onClick={addAllAiResults}
                      className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold border-2 border-orange-200 hover:shadow-lg transition-all"
                    >
                      Add All Items
                    </button>
                  )}
                </div>

                {aiResults.length > 0 && (
                  <div className="mt-4 border-2 border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                    {aiResults.map((it, idx) => (
                      <div key={it.id || idx} className="px-4 py-4 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{it.name}</div>
                            <div className="text-sm text-gray-500">
                              {it.quantity ?? 1} serving{(it.quantity ?? 1) > 1 ? 's' : ''}
                              {it.serving_size ? ` • ${it.serving_size}` : ''}
                            </div>
                            <div className="text-sm text-orange-600 font-medium">
                              {it.calories != null ? `${Math.round(it.calories)} kcal` : 'Calories NA'}
                              {it.protein != null && ` • ${Math.round(it.protein)}g protein`}
                            </div>
                          </div>
                          <button
                            onClick={() => addAiResult(it)}
                            className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Items */}
          {items.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Selected Items</h2>
              <div className="space-y-4">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-white rounded-2xl border-2 border-orange-100">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <span>{it.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                          {it.source === 'openfoodfacts' ? 'OpenFoodFacts' : it.source === 'ai' ? 'AI' : 'Local'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {Math.round((Number(it.calories) || 0) * (Number(it.quantity) || 1))} kcal
                        {it.protein != null && ` • ${Math.round(it.protein * (it.quantity || 1))}g protein`}
                        {it.serving_size && ` • ${it.serving_size}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-white rounded-xl p-2 border-2 border-gray-200">
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) - 1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{it.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) + 1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 p-2 transition-colors"
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
              onClick={submit}
              disabled={!items.length || saving}
              className="flex-1 px-8 py-4 gradient-primary text-white rounded-2xl font-bold hover:shadow-2xl disabled:opacity-50 transition-all text-lg"
            >
              {saving ? 'Saving...' : 'Save Meal'}
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

      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {customForm.id ? 'Edit Custom Food' : 'Add Custom Food'}
              </h2>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomForm(initialCustomForm);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  value={customForm.name}
                  onChange={e => updateCustomField('name', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Grilled Chicken Breast"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brand (optional)</label>
                  <input
                    value={customForm.brand}
                    onChange={e => updateCustomField('brand', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Homemade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Serving Size</label>
                  <input
                    value={customForm.serving_size}
                    onChange={e => updateCustomField('serving_size', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="100g"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Calories</label>
                  <input
                    type="number"
                    value={customForm.calories}
                    onChange={e => updateCustomField('calories', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={customForm.protein}
                    onChange={e => updateCustomField('protein', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={customForm.carbs}
                    onChange={e => updateCustomField('carbs', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={customForm.fat}
                    onChange={e => updateCustomField('fat', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setCustomForm(initialCustomForm);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomFood}
                  disabled={customSaving}
                  className="px-4 py-2 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {customSaving ? 'Saving...' : customForm.id ? 'Save Changes' : 'Create Food'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
