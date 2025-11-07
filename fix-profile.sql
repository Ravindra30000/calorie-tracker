-- Fix: Create profile for existing user
-- Run this in Supabase Dashboard → SQL Editor

-- Create profile for your current user (replace with your user ID if different)
INSERT INTO profiles (id, created_at, updated_at)
VALUES ('159be026-34f8-454a-874c-174d34326d97', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Also set up the trigger for future users
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify it worked
SELECT id, created_at FROM profiles WHERE id = '159be026-34f8-454a-874c-174d34326d97';

