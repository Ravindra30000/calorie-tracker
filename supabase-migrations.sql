-- Step 1: Create all database tables
-- Run this FIRST in Supabase Dashboard → SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  dob date,
  sex text,
  height_cm int,
  weight_kg numeric,
  activity_level text,
  calorie_goal int,
  protein_goal int,
  carbs_goal int,
  fat_goal int,
  premium_plan text DEFAULT 'free',
  premium_status text DEFAULT 'inactive',
  premium_since timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Food items master database
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  serving_size text,
  calories numeric NOT NULL,
  protein numeric,
  carbs numeric,
  fat numeric,
  source text,
  image_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription plans available
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_cents int NOT NULL,
  interval text NOT NULL CHECK (interval IN ('monthly','yearly','lifetime')),
  features jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions history
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id),
  provider text,
  provider_ref text,
  status text NOT NULL,
  started_at timestamptz DEFAULT now(),
  renewed_at timestamptz,
  expires_at timestamptz,
  cancel_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  name text,
  notes text,
  meal_time timestamptz NOT NULL,
  total_calories numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meal items (join table)
CREATE TABLE IF NOT EXISTS meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid REFERENCES meals(id) ON DELETE CASCADE,
  food_item_id uuid REFERENCES food_items(id),
  custom_name text,
  quantity numeric DEFAULT 1,
  unit text,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  created_at timestamptz DEFAULT now()
);

-- Meal templates (favorites)
CREATE TABLE IF NOT EXISTS meal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  description text,
  total_calories numeric DEFAULT 0,
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_item_id uuid REFERENCES food_items(id),
  custom_name text,
  quantity numeric DEFAULT 1,
  unit text,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  created_at timestamptz DEFAULT now()
);

-- User goals (historical tracking)
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  date_from date NOT NULL,
  date_to date,
  calorie_goal int,
  protein_goal int,
  carbs_goal int,
  fat_goal int,
  created_at timestamptz DEFAULT now()
);

-- Daily logs (aggregated data for fast analytics)
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  day date NOT NULL,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_time ON meals(user_id, meal_time);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_day ON daily_logs(user_id, day);

-- Step 2: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies

-- Profiles: users can read/update their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_upsert_own" ON profiles;
CREATE POLICY "profiles_upsert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Meals: users can manage their own meals
DROP POLICY IF EXISTS "meals_owner" ON meals;
CREATE POLICY "meals_owner" ON meals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Meal items: users can manage items in their own meals
DROP POLICY IF EXISTS "meal_items_via_meal" ON meal_items;
CREATE POLICY "meal_items_via_meal" ON meal_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meals m 
      WHERE m.id = meal_items.meal_id 
      AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meals m 
      WHERE m.id = meal_items.meal_id 
      AND m.user_id = auth.uid()
    )
  );

-- Daily logs: users can manage their own logs
DROP POLICY IF EXISTS "daily_logs_owner" ON daily_logs;
CREATE POLICY "daily_logs_owner" ON daily_logs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User goals: users can manage their own goals
DROP POLICY IF EXISTS "user_goals_owner" ON user_goals;
CREATE POLICY "user_goals_owner" ON user_goals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Meal templates policies
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_templates_owner" ON meal_templates;
CREATE POLICY "meal_templates_owner" ON meal_templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "template_items_via_template" ON meal_template_items;
CREATE POLICY "template_items_via_template" ON meal_template_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_templates mt
      WHERE mt.id = meal_template_items.template_id
      AND mt.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_templates mt
      WHERE mt.id = meal_template_items.template_id
      AND mt.user_id = auth.uid()
    )
  );

-- Food items: public readable, users can insert/update their own
DROP POLICY IF EXISTS "food_items_read" ON food_items;
CREATE POLICY "food_items_read" ON food_items
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "food_items_write_own" ON food_items;
CREATE POLICY "food_items_write_own" ON food_items
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "food_items_update_own" ON food_items;
CREATE POLICY "food_items_update_own" ON food_items
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Subscription plans are public read, admin write (for now allow authenticated select)
DROP POLICY IF EXISTS "subscription_plans_read" ON subscription_plans;
CREATE POLICY "subscription_plans_read" ON subscription_plans
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "subscription_plans_manage" ON subscription_plans;
CREATE POLICY "subscription_plans_manage" ON subscription_plans
  FOR ALL TO authenticated WITH CHECK (false);

-- Subscriptions owned by user
DROP POLICY IF EXISTS "subscriptions_owner" ON subscriptions;
CREATE POLICY "subscriptions_owner" ON subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

