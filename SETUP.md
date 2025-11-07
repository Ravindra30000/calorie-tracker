# BiteTrack Setup Guide

## Quick Start

### 1. Database Setup

Run these SQL files in Supabase Dashboard → SQL Editor (in order):

1. **`supabase-migrations.sql`** - Creates all tables, indexes, and RLS policies
2. **`supabase-seed.sql`** - Adds initial food items
3. **`supabase-trigger.sql`** - Auto-creates profiles for new users

### 2. Environment Variables

Create `.env.local` in the `bitetrack` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Install Dependencies

```bash
cd bitetrack
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Features

✅ **Authentication**
- Email/Password signup and login
- Google OAuth
- Password reset

✅ **Meal Logging**
- Quick food search
- Add multiple items to a meal
- Adjust quantities
- Save meals with timestamps

✅ **Dashboard**
- Today's calorie summary
- Progress bar toward daily goal
- Meal list with details
- Quick navigation

✅ **Analytics**
- 7-day calorie trend chart
- Daily breakdown
- Average and totals

## Database Schema

- `profiles` - User profile data
- `food_items` - Master food database
- `meals` - User-recorded meals
- `meal_items` - Items within each meal
- `user_goals` - Historical goal tracking
- `daily_logs` - Aggregated daily data

## Troubleshooting

**401 Unauthorized errors:**
- Make sure you're logged in
- Check that RLS policies are enabled
- Verify your profile exists in the `profiles` table

**Foreign key constraint errors:**
- Run `supabase-trigger.sql` to auto-create profiles
- Or manually insert: `INSERT INTO profiles (id) VALUES ('your-user-uuid');`

**Meals not saving:**
- Check browser console for errors
- Verify API routes are working
- Ensure food_items table has data (run seed.sql)

## Next Steps

- Add profile onboarding flow
- Implement meal editing
- Add macro tracking (protein/carbs/fat)
- Create CSV export
- Add image-based food recognition

