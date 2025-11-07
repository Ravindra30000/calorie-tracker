// TDEE (Total Daily Energy Expenditure) calculation utilities

export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface TDEEParams {
  sex: Sex;
  age: number; // in years
  height: number; // in cm
  weight: number; // in kg
  activityLevel: ActivityLevel;
}

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 */
export function calculateBMR({ sex, age, height, weight }: Omit<TDEEParams, 'activityLevel'>): number {
  // Mifflin-St Jeor Equation
  // BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + s
  // where s = +5 for males, -161 for females
  
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  const sexAdjustment = sex === 'male' ? 5 : sex === 'female' ? -161 : -78; // average for other
  
  return baseBMR + sexAdjustment;
}

/**
 * Activity multipliers for TDEE calculation
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9,    // Very hard exercise, physical job
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export function calculateTDEE(params: TDEEParams): number {
  const bmr = calculateBMR(params);
  const multiplier = ACTIVITY_MULTIPLIERS[params.activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Calculate calorie goal based on objective
 */
export function calculateCalorieGoal(
  tdee: number,
  objective: 'maintain' | 'lose' | 'gain',
  deficitOrSurplus: number = 500 // default 500 kcal deficit/surplus
): number {
  switch (objective) {
    case 'lose':
      return Math.max(1200, Math.round(tdee - deficitOrSurplus)); // minimum 1200 kcal
    case 'gain':
      return Math.round(tdee + deficitOrSurplus);
    case 'maintain':
    default:
      return Math.round(tdee);
  }
}

/**
 * Calculate macro goals based on calorie goal and preferences
 */
export function calculateMacroGoals(
  calorieGoal: number,
  proteinPerKg: number = 1.6, // grams per kg body weight (default for active individuals)
  weightKg: number,
  fatPercentage: number = 0.25 // 25% of calories from fat
): { protein: number; carbs: number; fat: number } {
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinGrams * 4; // 4 kcal per gram
  
  const fatCalories = Math.round(calorieGoal * fatPercentage);
  const fatGrams = Math.round(fatCalories / 9); // 9 kcal per gram
  
  const remainingCalories = calorieGoal - proteinCalories - fatCalories;
  const carbsGrams = Math.max(0, Math.round(remainingCalories / 4)); // 4 kcal per gram
  
  return {
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
  };
}

