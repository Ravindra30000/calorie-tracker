-- Seed food_items table with common foods
-- Run this in Supabase Dashboard → SQL Editor

INSERT INTO food_items (name, serving_size, calories, protein, carbs, fat, source)
VALUES
('Apple (100 g)', '100 g', 52, 0.3, 14, 0.2, 'manual'),
('Banana (100 g)', '100 g', 89, 1.1, 23, 0.3, 'manual'),
('Boiled Egg (1 egg)', '1 egg', 78, 6.3, 0.6, 5.3, 'manual'),
('Chicken Breast (100 g)', '100 g', 165, 31, 0, 3.6, 'manual'),
('White Rice (100 g cooked)', '100 g', 130, 2.7, 28, 0.3, 'manual'),
('Broccoli (100 g)', '100 g', 34, 2.8, 7, 0.4, 'manual'),
('Salmon (100 g)', '100 g', 208, 20, 0, 12, 'manual'),
('Oatmeal (100 g cooked)', '100 g', 68, 2.4, 12, 1.4, 'manual'),
('Greek Yogurt (100 g)', '100 g', 59, 10, 3.6, 0.4, 'manual'),
('Whole Wheat Bread (1 slice)', '1 slice', 81, 4, 13, 1.1, 'manual');

INSERT INTO subscription_plans (code, name, description, price_cents, interval, features)
VALUES
('free', 'Free Plan', 'Core tracking features', 0, 'lifetime', '["Food search","Meal logging","Analytics"]'),
('pro-monthly', 'Pro Monthly', 'Advanced insights with monthly billing', 999, 'monthly', '["AI planner","Advanced analytics","Priority support"]'),
('pro-yearly', 'Pro Yearly', 'Save 20% with annual billing', 9990, 'yearly', '["AI planner","Advanced analytics","Priority support"]')
ON CONFLICT (code) DO NOTHING;

