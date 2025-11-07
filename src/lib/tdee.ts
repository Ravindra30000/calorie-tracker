/**
 * Calculate TDEE (Total Daily Energy Expenditure) using Mifflin-St Jeor Equation
 * and activity level multipliers
 */

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female' | 'other';

export interface TDEEInputs {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

export interface TDEEOutput {
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  calorieGoal: number; // Recommended calorie goal
  proteinGoal: number; // Recommended protein goal (g)
  carbsGoal: number; // Recommended carbs goal (g)
  fatGoal: number; // Recommended fat goal (g)
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Little to no exercise
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  active: 1.725, // Hard exercise 6-7 days/week
  very_active: 1.9, // Very hard exercise, physical job
};

export function calculateTDEE(inputs: TDEEInputs): TDEEOutput {
  const { age, sex, heightCm, weightKg, activityLevel } = inputs;

  // Mifflin-St Jeor Equation for BMR
  // BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + s
  // where s = +5 for males, -161 for females
  const sexMultiplier = sex === 'male' ? 5 : sex === 'female' ? -161 : -78; // Average for 'other'
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexMultiplier;

  // TDEE = BMR × Activity Multiplier
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

  // Recommended calorie goal (round to nearest 50)
  const calorieGoal = Math.round(tdee / 50) * 50;

  // Macro goals (based on common recommendations)
  // Protein: 0.8-1g per kg body weight (we'll use 1.2g for active people)
  const proteinPerKg = activityLevel === 'sedentary' ? 0.8 : activityLevel === 'light' ? 1.0 : 1.2;
  const proteinGoal = Math.round(weightKg * proteinPerKg);

  // Fat: 25-30% of calories (we'll use 25%)
  const fatCalories = calorieGoal * 0.25;
  const fatGoal = Math.round(fatCalories / 9); // 9 calories per gram of fat

  // Carbs: Remaining calories after protein and fat
  const proteinCalories = proteinGoal * 4; // 4 calories per gram of protein
  const carbCalories = calorieGoal - proteinCalories - fatCalories;
  const carbsGoal = Math.round(carbCalories / 4); // 4 calories per gram of carbs

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
  };
}

export function getActivityLevelDescription(level: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'Little to no exercise',
    light: 'Light exercise 1-3 days/week',
    moderate: 'Moderate exercise 3-5 days/week',
    active: 'Hard exercise 6-7 days/week',
    very_active: 'Very hard exercise, physical job',
  };
  return descriptions[level];
}

