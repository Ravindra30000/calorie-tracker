'use client';
import { useParams, useRouter } from 'next/navigation';
import { useMeals } from '@/hooks/useMeals';
import { useDeleteMeal } from '@/hooks/useMeals';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/layout/Navbar';
import { useCreateTemplate } from '@/hooks/useTemplates';

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = params.id as string;
  const { data: meals, isLoading } = useMeals();
  const deleteMeal = useDeleteMeal();
  const [deleting, setDeleting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const meal = meals?.find((m) => m.id === mealId);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const createTemplate = useCreateTemplate();

  useEffect(() => {
    if (meal) {
      loadItems();
    }
  }, [meal]);

  async function loadItems() {
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
      setLoadingItems(false);
    }
  }

  async function handleSaveTemplate() {
    if (!meal) return;
    setSavingTemplate(true);
    try {
      await createTemplate.mutateAsync({ meal_id: mealId, name: meal.name || undefined });
      alert('Saved to favorites!');
    } catch (error: any) {
      alert(error.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this meal?')) return;
    setDeleting(true);
    try {
      await deleteMeal.mutateAsync(mealId);
      router.push('/dashboard');
    } catch (error) {
      alert('Failed to delete meal');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch(`/api/meals/${mealId}/duplicate`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/meals/${data.meal.id}`);
      } else {
        alert(data.error || 'Failed to duplicate meal');
      }
    } catch (error) {
      alert('Failed to duplicate meal');
    } finally {
      setDuplicating(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading meal details...</div>
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

          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{meal.name || 'Meal'}</h1>
                <p className="text-gray-600">
                  {format(new Date(meal.meal_time), 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(new Date(meal.meal_time), 'h:mm a')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{meal.total_calories || 0}</div>
                <div className="text-sm text-gray-500">kcal</div>
              </div>
            </div>

            {meal.notes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{meal.notes}</p>
              </div>
            )}

            {/* Meal Items */}
            {loadingItems ? (
              <div className="mb-6 text-center text-gray-500">Loading items...</div>
            ) : items.length > 0 ? (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Items</h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.food_items?.name || item.custom_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit || 'serving'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{item.calories} kcal</div>
                        {item.protein && (
                          <div className="text-xs text-gray-500">
                            P: {item.protein}g C: {item.carbs}g F: {item.fat}g
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 text-center text-gray-500">No items in this meal</div>
            )}

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between">
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => router.push(`/meals/${mealId}/edit`)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Edit Meal
                  </button>
                  <button
                    onClick={handleDuplicate}
                    disabled={duplicating}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {duplicating ? 'Duplicating...' : 'Duplicate'}
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {savingTemplate ? 'Saving...' : 'Save as Favorite'}
                  </button>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete Meal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
