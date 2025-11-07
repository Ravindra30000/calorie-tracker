'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { MealTemplate } from '@/lib/types';

async function fetchWithAuth(url: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const res = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export function useMealTemplates() {
  return useQuery<{ templates: MealTemplate[] }>({
    queryKey: ['meal_templates'],
    queryFn: () => fetchWithAuth('/api/templates'),
  });
}

export function useFrequentMeals() {
  return useQuery<{ suggestions: Array<{ name: string; count: number; meal: any }> }>({
    queryKey: ['frequent_meals'],
    queryFn: () => fetchWithAuth('/api/meals/frequent'),
  });
}

export function useSubscriptionPlans() {
  return useQuery<{ plans: Array<any> }>({
    queryKey: ['subscription_plans'],
    queryFn: () => fetchWithAuth('/api/plans'),
  });
}

export function useSubscription() {
  return useQuery<{ subscription: any }>({
    queryKey: ['subscription'],
    queryFn: () => fetchWithAuth('/api/subscriptions'),
    retry: false,
  });
}

export function useManageSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { plan_code?: string; action: 'subscribe' | 'cancel' }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (input.action === 'subscribe') {
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ plan_code: input.plan_code }),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || 'Failed to subscribe');
        }
        return res.json();
      } else {
        const res = await fetch('/api/subscriptions', {
          method: 'DELETE',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || 'Failed to cancel subscription');
        }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { meal_id?: string; name?: string; description?: string; items?: any[] }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create template');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal_templates'] });
    },
  });
}

export function useCustomFoods() {
  return useQuery<{ items: Array<any> }>({
    queryKey: ['custom_foods'],
    queryFn: () => fetchWithAuth('/api/food/custom'),
  });
}

export function useSaveCustomFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id?: string; name: string; brand?: string; serving_size?: string; calories?: number | string | null; protein?: number | string | null; carbs?: number | string | null; fat?: number | string | null }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const method = payload.id ? 'PATCH' : 'POST';
      const res = await fetch('/api/food/custom', {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save custom food');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_foods'] });
      queryClient.invalidateQueries({ queryKey: ['food_items'] });
    },
  });
}

