// Shared TypeScript types for BiteTrack

export interface Profile {
  id: string;
  full_name: string | null;
  dob: string | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  calorie_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  premium_plan: string | null;
  premium_status: string | null;
  premium_since: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  serving_size: string | null;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  source: string | null;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string | null;
  notes: string | null;
  meal_time: string;
  total_calories: number;
  created_at: string;
  updated_at: string;
  meal_items?: Array<Partial<MealItem>>;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_item_id: string | null;
  custom_name: string | null;
  quantity: number;
  unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  created_at: string;
}

export interface MealTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  total_calories: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
  items?: MealTemplateItem[];
}

export interface MealTemplateItem {
  id: string;
  template_id: string;
  food_item_id: string | null;
  custom_name: string | null;
  quantity: number;
  unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  created_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  date_from: string;
  date_to: string | null;
  calorie_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  day: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  updated_at: string;
}

