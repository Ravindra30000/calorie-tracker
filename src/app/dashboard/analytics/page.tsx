'use client';
import { useMeals } from '@/hooks/useMeals';
import { useUser } from '@/hooks/useUser';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function AnalyticsPage() {
  const { data: user } = useUser();
  const today = new Date();
  const sevenDaysAgo = format(subDays(today, 6), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const { data: meals, isLoading } = useMeals(sevenDaysAgo, todayStr);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics</h1>
            <p className="text-gray-600 mb-6">Please log in to view analytics.</p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Group meals by day
  const dailyData = meals?.reduce((acc, meal) => {
    const day = format(new Date(meal.meal_time), 'yyyy-MM-dd');
    if (!acc[day]) {
      acc[day] = { day, calories: 0, date: day };
    }
    acc[day].calories += meal.total_calories || 0;
    return acc;
  }, {} as Record<string, { day: string; calories: number; date: string }>) || {};

  // Fill in missing days with 0
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const dayName = format(subDays(today, i), 'EEE');
    const fullDate = format(subDays(today, i), 'MMM d');
    chartData.push({
      date: dayName,
      fullDate,
      calories: dailyData[date]?.calories || 0,
    });
  }

  const averageCalories = chartData.reduce((sum, d) => sum + d.calories, 0) / chartData.length;
  const maxCalories = Math.max(...chartData.map(d => d.calories), 1);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">7-Day Average</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{Math.round(averageCalories)}</div>
              <div className="mt-2 text-sm text-gray-600">kcal/day</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Highest Day</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{maxCalories}</div>
              <div className="mt-2 text-sm text-gray-600">kcal</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total This Week</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {chartData.reduce((sum, d) => sum + d.calories, 0)}
              </div>
              <div className="mt-2 text-sm text-gray-600">kcal</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">7-Day Calorie Trend</h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading chart data...</div>
              </div>
            ) : (
              <div style={{ width: '100%', height: 400, minHeight: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => `Day: ${value}`}
                      formatter={(value: number) => [`${value} kcal`, 'Calories']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="calories" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Calories"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Daily Breakdown</h2>
            <div className="space-y-3">
              {chartData.map((d) => (
                <div key={d.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{d.fullDate}</div>
                    <div className="text-sm text-gray-500">{d.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">{d.calories}</div>
                    <div className="text-sm text-gray-500">kcal</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
