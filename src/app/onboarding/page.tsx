'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calculateTDEE, getActivityLevelDescription, type ActivityLevel, type Sex } from '@/lib/tdee';
import Navbar from '@/components/layout/Navbar';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  
  // Calculated goals
  const [goals, setGoals] = useState<any>(null);

  function calculateGoals() {
    if (!dob || !heightCm || !weightKg) return;

    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    const calculated = calculateTDEE({
      age: actualAge,
      sex,
      heightCm: parseInt(heightCm),
      weightKg: parseFloat(weightKg),
      activityLevel,
    });

    setGoals(calculated);
    setStep(3);
  }

  async function saveProfile() {
    if (!fullName || !dob || !heightCm || !weightKg || !goals) return;

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const { data, error } = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          full_name: fullName,
          dob,
          sex,
          height_cm: parseInt(heightCm),
          weight_kg: parseFloat(weightKg),
          activity_level: activityLevel,
          calorie_goal: goals.calorieGoal,
          protein_goal: goals.proteinGoal,
          carbs_goal: goals.carbsGoal,
          fat_goal: goals.fatGoal,
        }),
      }).then(r => r.json());

      if (error) {
        alert(error);
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step >= s
                          ? 'gradient-primary text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          step > s ? 'gradient-primary' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 1 && 'Personal Information'}
                  {step === 2 && 'Activity Level'}
                  {step === 3 && 'Your Goals'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {step === 1 && 'Tell us about yourself'}
                  {step === 2 && 'How active are you?'}
                  {step === 3 && 'We calculated your daily goals'}
                </p>
              </div>
            </div>

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sex</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['male', 'female', 'other'] as Sex[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSex(s)}
                        className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                          sex === s
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="70"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!fullName || !dob || !heightCm || !weightKg}
                  className="w-full py-3 px-4 rounded-xl text-white font-semibold gradient-primary hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Activity Level */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as ActivityLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setActivityLevel(level)}
                      className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all ${
                        activityLevel === level
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 capitalize mb-1">{level.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-600">{getActivityLevelDescription(level)}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={calculateGoals}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-semibold gradient-primary hover:shadow-lg transition-all"
                  >
                    Calculate Goals
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Goals Review */}
            {step === 3 && goals && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-orange-600 mb-2">{goals.calorieGoal}</div>
                    <div className="text-gray-600">Daily Calorie Goal</div>
                    <div className="text-sm text-gray-500 mt-2">
                      Based on your TDEE: {goals.tdee} kcal/day
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{goals.proteinGoal}g</div>
                    <div className="text-sm text-gray-600 mt-1">Protein</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{goals.carbsGoal}g</div>
                    <div className="text-sm text-gray-600 mt-1">Carbs</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{goals.fatGoal}g</div>
                    <div className="text-sm text-gray-600 mt-1">Fat</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-semibold gradient-primary hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Saving...' : 'Complete Setup'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

