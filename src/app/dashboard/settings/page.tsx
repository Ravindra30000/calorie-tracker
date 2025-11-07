'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { calculateTDEE, getActivityLevelDescription, type ActivityLevel, type Sex } from '@/lib/tdee';
import { format, subDays } from 'date-fns';
import Navbar from '@/components/layout/Navbar';

export default function SettingsPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    dob: '',
    sex: 'male' as Sex,
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderate' as ActivityLevel,
    calorie_goal: 0,
    protein_goal: 0,
    carbs_goal: 0,
    fat_goal: 0,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        dob: profile.dob ? format(new Date(profile.dob), 'yyyy-MM-dd') : '',
        sex: (profile.sex as Sex) || 'male',
        height_cm: profile.height_cm?.toString() || '',
        weight_kg: profile.weight_kg?.toString() || '',
        activity_level: (profile.activity_level as ActivityLevel) || 'moderate',
        calorie_goal: profile.calorie_goal || 0,
        protein_goal: profile.protein_goal || 0,
        carbs_goal: profile.carbs_goal || 0,
        fat_goal: profile.fat_goal || 0,
      });
    }
  }, [profile]);

  async function handleExport() {
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const res = await fetch(
        `/api/export/csv?from=${dateRange.from}&to=${dateRange.to}`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );

      if (!res.ok) {
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitetrack-export-${dateRange.from}-to-${dateRange.to}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  }

  function recalculateGoals() {
    if (!profileData.dob || !profileData.height_cm || !profileData.weight_kg) return;

    const birthDate = new Date(profileData.dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    const goals = calculateTDEE({
      age: actualAge,
      sex: profileData.sex,
      heightCm: parseInt(profileData.height_cm),
      weightKg: parseFloat(profileData.weight_kg),
      activityLevel: profileData.activity_level,
    });

    setProfileData({
      ...profileData,
      calorie_goal: goals.calorieGoal,
      protein_goal: goals.proteinGoal,
      carbs_goal: goals.carbsGoal,
      fat_goal: goals.fatGoal,
    });
  }

  async function saveProfile() {
    try {
      await updateProfile.mutateAsync(profileData);
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    }
  }

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

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Settings</h1>

          {/* Profile Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile & Goals</h2>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="px-4 py-2 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={profileData.dob}
                      onChange={e => setProfileData({ ...profileData, dob: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={profileData.height_cm}
                      onChange={e => setProfileData({ ...profileData, height_cm: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profileData.weight_kg}
                      onChange={e => setProfileData({ ...profileData, weight_kg: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Level</label>
                  <select
                    value={profileData.activity_level}
                    onChange={e => setProfileData({ ...profileData, activity_level: e.target.value as ActivityLevel })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as ActivityLevel[]).map((level) => (
                      <option key={level} value={level}>
                        {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - {getActivityLevelDescription(level)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={recalculateGoals}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Recalculate Goals
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={updateProfile.isPending}
                    className="px-6 py-2 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Daily Calorie Goal</div>
                    <div className="text-2xl font-bold text-orange-600">{profile?.calorie_goal || 2000} kcal</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Activity Level</div>
                    <div className="text-lg font-semibold text-gray-900 capitalize">
                      {profile?.activity_level?.replace('_', ' ') || 'Not set'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-sm text-gray-500">Protein Goal</div>
                    <div className="text-xl font-bold text-blue-600">{profile?.protein_goal || 0}g</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Carbs Goal</div>
                    <div className="text-xl font-bold text-green-600">{profile?.carbs_goal || 0}g</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fat Goal</div>
                    <div className="text-xl font-bold text-purple-600">{profile?.fat_goal || 0}g</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Data */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Data</h2>
            <p className="text-gray-600 mb-4">
              Export your meal data as a CSV file for backup or analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
