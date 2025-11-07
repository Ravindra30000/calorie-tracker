'use client';

import { useMemo, useRef, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { format, subDays } from 'date-fns';
import { useMeals } from '@/hooks/useMeals';
import { useProfile } from '@/hooks/useProfile';
import Link from 'next/link';

export default function SharePage() {
  const today = new Date();
  const to = format(today, 'yyyy-MM-dd');
  const from = format(subDays(today, 6), 'yyyy-MM-dd');
  const { data: meals, isLoading } = useMeals(from, to);
  const { data: profile } = useProfile();
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    if (!meals || meals.length === 0) {
      return {
        totalCalories: 0,
        daysLogged: 0,
        averageCalories: 0,
        macros: { protein: 0, carbs: 0, fat: 0 },
      };
    }

    const daySet = new Set<string>();
    const totals = meals.reduce(
      (acc, meal) => {
        daySet.add(format(new Date(meal.meal_time), 'yyyy-MM-dd'));
        const mealCalories = Number(meal.total_calories) || 0;
        acc.totalCalories += mealCalories;

        if (meal.meal_items && Array.isArray(meal.meal_items)) {
          meal.meal_items.forEach((item) => {
            acc.macros.protein += Number(item.protein) || 0;
            acc.macros.carbs += Number(item.carbs) || 0;
            acc.macros.fat += Number(item.fat) || 0;
          });
        }
        return acc;
      },
      { totalCalories: 0, macros: { protein: 0, carbs: 0, fat: 0 } }
    );

    const daysLogged = daySet.size || 1;
    const averageCalories = totals.totalCalories / daysLogged;

    return {
      totalCalories: Math.round(totals.totalCalories),
      daysLogged,
      averageCalories: Math.round(averageCalories),
      macros: {
        protein: Math.round(totals.macros.protein),
        carbs: Math.round(totals.macros.carbs),
        fat: Math.round(totals.macros.fat),
      },
    };
  }, [meals]);

  const summaryText = useMemo(() => {
    return `BiteTrack Progress (${from} - ${to})\n` +
      `Total Calories: ${stats.totalCalories}\n` +
      `Average / day: ${stats.averageCalories}\n` +
      `Macros — Protein: ${stats.macros.protein}g, Carbs: ${stats.macros.carbs}g, Fat: ${stats.macros.fat}g`;
  }, [stats, from, to]);

  function createCaptureClone(): HTMLElement | null {
    if (!cardRef.current) return null;
    const original = cardRef.current;
    const clone = original.cloneNode(true) as HTMLElement;
    clone.style.background = '#ffffff';
    clone.style.boxShadow = 'none';
    clone.style.transform = 'none';
    clone.style.filter = 'none';

    // Replace gradient classes with solid fallbacks to avoid unsupported color() / lab() parsing
    const solidFallbacks: Record<string, string> = {
      'gradient-primary': '#f97316',
      'gradient-success': '#10b981',
      'gradient-blue': '#3b82f6',
      'gradient-green': '#10b981',
      'gradient-purple': '#8b5cf6',
      'from-orange-500': '#f97316',
      'to-orange-600': '#ea580c',
      'from-blue-500': '#3b82f6',
      'to-blue-600': '#2563eb',
      'from-green-500': '#10b981',
      'to-green-600': '#059669',
      'from-blue-50': '#eff6ff',
      'to-blue-100': '#dbeafe',
      'from-green-50': '#ecfdf5',
      'to-green-100': '#d1fae5',
      'from-purple-50': '#f5f3ff',
      'to-purple-100': '#ede9fe',
    };

    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
    // @ts-ignore - TS can't infer nodeType narrowing here
    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement;
      const classList = Array.from(el.classList || []);
      const hasGradient = classList.some(c => c.startsWith('gradient-') || c.startsWith('from-') || c.startsWith('to-'));
      if (hasGradient) {
        // Pick the first mapped fallback we find
        for (const cls of classList) {
          if (solidFallbacks[cls]) {
            el.style.background = solidFallbacks[cls];
            break;
          }
        }
        // As a safety, if still no background set, use white
        if (!el.style.background) el.style.background = '#ffffff';
        // Remove backdrop/filters that can confuse renderers
        el.style.backdropFilter = 'none';
      }
    }

    // Position offscreen for capture
    clone.style.position = 'fixed';
    clone.style.left = '-99999px';
    clone.style.top = '0';
    document.body.appendChild(clone);
    return clone;
  }

  async function handleDownload() {
    const clone = createCaptureClone();
    const target = clone || cardRef.current;
    if (!target) return;
    try {
      setGenerating(true);
      // Try html2canvas first
      const html2canvas = (await import('html2canvas')).default;
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(target as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: Math.max(2, Math.floor(window.devicePixelRatio || 2)),
        useCORS: true,
        logging: false,
        foreignObjectRendering: true as any,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `bitetrack-share-${to}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err1) {
      // Fallback to html-to-image which supports more CSS
      try {
        const { toPng } = await import('html-to-image');
        const dataUrl = await toPng(target as HTMLElement, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          pixelRatio: Math.max(2, Math.floor(window.devicePixelRatio || 2)),
        });
        const link = document.createElement('a');
        link.download = `bitetrack-share-${to}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err2) {
        console.error('Failed to generate image', err1, err2);
        alert('Could not generate share image.');
      }
    } finally {
      setGenerating(false);
      // Clean up clone if used
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
    }
  }

  async function handleShare() {
    if (!navigator.share || !cardRef.current) {
      await handleDownload();
      return;
    }

    try {
      setGenerating(true);
      const clone = createCaptureClone();
      const target = clone || cardRef.current;

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(target as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: Math.max(2, Math.floor(window.devicePixelRatio || 2)),
        useCORS: true,
        logging: false,
        foreignObjectRendering: true as any,
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
      if (!blob) throw new Error('Failed to create image blob');

      const file = new File([blob], `bitetrack-share-${to}.png`, { type: 'image/png' });

      await navigator.share({
        files: [file],
        title: 'My BiteTrack Progress',
        text: summaryText,
      });
    } catch (error) {
      console.error('Share failed', error);
      alert('Sharing failed. The image was downloaded instead.');
      await handleDownload();
    } finally {
      setGenerating(false);
      const clones = document.querySelectorAll('#__capture_clone__');
    }
  }

  function shareToWhatsApp() {
    // WhatsApp Web/mobile supports text sharing via URL
    const url = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  }

  function shareToTelegram() {
    // Telegram supports both url and text; we pass text summary
    const url = `https://t.me/share/url?url=${encodeURIComponent('')}&text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed', error);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Your Progress</h1>
          <p className="text-gray-600 mb-8">
            Generate a shareable summary of your recent progress. Download the image or share it directly with friends.
          </p>

          <div
            ref={cardRef}
            className="bg-white rounded-3xl shadow-2xl p-8 mb-6 card-hover animate-fade-in"
            style={{ maxWidth: 720 }}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-wide text-orange-500 font-bold">BiteTrack Weekly Summary</div>
                  <div className="text-gray-500 text-sm">{format(subDays(today, 6), 'MMM d')} - {format(today, 'MMM d, yyyy')}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-xl">
                  B
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="text-sm opacity-80">Total Calories</div>
                <div className="text-3xl font-bold mt-2">{stats.totalCalories}</div>
                <div className="text-xs opacity-80 mt-2">Goal: {profile?.calorie_goal || 2000} kcal/day</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="text-sm opacity-80">Average per Day</div>
                <div className="text-3xl font-bold mt-2">{stats.averageCalories}</div>
                <div className="text-xs opacity-80 mt-2">Days logged: {stats.daysLogged}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="text-sm opacity-80">Goal Progress</div>
                <div className="text-xl font-bold mt-2">
                  {profile?.calorie_goal
                    ? `${Math.round((stats.averageCalories / profile.calorie_goal) * 100)}%`
                    : '—'}
                </div>
                <div className="text-xs opacity-80 mt-2">of daily goal</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                <div className="text-xs text-gray-500">Protein</div>
                <div className="text-2xl font-bold text-blue-600">{stats.macros.protein}g</div>
                {profile?.protein_goal && (
                  <div className="text-xs text-gray-500 mt-1">Goal {profile.protein_goal}g</div>
                )}
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
                <div className="text-xs text-gray-500">Carbs</div>
                <div className="text-2xl font-bold text-green-600">{stats.macros.carbs}g</div>
                {profile?.carbs_goal && (
                  <div className="text-xs text-gray-500 mt-1">Goal {profile.carbs_goal}g</div>
                )}
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
                <div className="text-xs text-gray-500">Fat</div>
                <div className="text-2xl font-bold text-purple-600">{stats.macros.fat}g</div>
                {profile?.fat_goal && (
                  <div className="text-xs text-gray-500 mt-1">Goal {profile.fat_goal}g</div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              Powered by BiteTrack • Stay consistent, stay healthy
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDownload}
              disabled={generating || isLoading}
              className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {generating ? 'Generating...' : 'Download Image'}
            </button>
            <button
              onClick={handleShare}
              disabled={generating || isLoading}
              className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold border-2 border-orange-200 hover:shadow-lg disabled:opacity-50 transition-all"
            >
              Share Progress
            </button>
            <button
              onClick={shareToWhatsApp}
              className="px-6 py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              WhatsApp
            </button>
            <button
              onClick={shareToTelegram}
              className="px-6 py-3 bg-[#229ED9] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Telegram
            </button>
            <button
              onClick={handleCopy}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:shadow-lg transition-all"
            >
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

