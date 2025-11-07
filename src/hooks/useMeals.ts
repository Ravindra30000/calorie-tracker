'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Meal, MealItem } from '@/lib/types';

interface CreateMealInput {
  name?: string;
  meal_time: string;
  items?: Array<{
    food_item_id?: string;
    custom_name?: string;
    quantity?: number;
    unit?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>;
}

export function useMeals(from?: string, to?: string) {
  return useQuery({
    queryKey: ['meals', from, to],
    queryFn: async () => {
      // Include Supabase JWT so API routes can authenticate the user
      const { data: sessionData } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/meals?${params.toString()}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to fetch meals');
      const data = await res.json();
      return data.meals as Array<Meal & { meal_items?: MealItem[] }>;
    },
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateMealInput) => {
      const { data: sessionData } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create meal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mealId: string) => {
      // Include Supabase JWT so API routes can authenticate the user
      const { data: sessionData } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete meal');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

