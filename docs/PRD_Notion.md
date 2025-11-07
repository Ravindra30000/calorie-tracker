# BiteTrack — Product Requirements Document

> **Role:** Senior Full-Stack Architect & Product Strategist

---

## 1. Executive Summary / Product Overview

**App name:** BiteTrack

**One-liner:** A modern, AI-assisted calorie tracker and nutrition coach: quick meal logging (text, photo, or voice), personalized calorie goals, progress dashboards, and intelligent meal suggestions.

### Target Users

- People wanting to track calories and macronutrients (18–45 yrs)
- Fitness beginners and intermediate gym-goers
- Users on diets (weight loss, maintenance, muscle gain)
- Busy professionals who want fast logging (voice/photo)

### Primary Goals

1. Make logging fast (≤10s common flows) and low-friction
2. Provide accurate calorie estimates and weekly progress insights
3. Offer AI-powered suggestions to stay within goals
4. Maintain privacy-first data handling and allow offline-first experiences where possible

---

## 2. Major Features (MVP → V1 → V2 Roadmap)

### MVP (Must-Have)

- ✅ Email/Password + OAuth sign-up (Google) via Supabase Auth
- ✅ Quick text meal logging (food search + quantity)
- ✅ Manual food item database (seeded + user-created items)
- ✅ Daily calorie goal setting & macros target (protein/carbs/fat)
- ✅ Daily log view + simple progress bar
- ✅ Basic analytics: daily/weekly calories, average intake
- ✅ Responsive UI using Next.js + Tailwind

### V1 (Soon After MVP)

- ⏳ Image-based food recognition (upload image → AI suggest items & calories)
- ⏳ Smart meal suggestions (AI-generated recipes that fit remaining calories)
- ⏳ Edit/duplicate meal logs; recurring meals
- ⏳ Export data (CSV)
- ⏳ Social/Share progress (optional)

### V2 (Advanced)

- ⏳ Voice logging & assistant (short voice → transcribed → logged)
- ⏳ Integrations: Apple Health / Google Fit export/import
- ⏳ Premium subscription: deeper analytics, personalized meal plans
- ⏳ Multi-device offline sync

---

## 3. User Journeys / Flows

### Flow A — Sign-up & Onboarding

1. User opens app → sees CTA: Sign up / Log in
2. Sign up with email or Google → minimal profile: name, age, sex, height, weight, activity level
3. App suggests a daily calorie goal (TDEE-based) with an editable slider
4. Short 3-step onboarding showing: log a meal, view dashboard, enable photo/voice features

### Flow B — Quick Meal Log

1. Tap `+` (Log Meal) → choose Text / Photo / Voice
2. **Text:** search food name, select quantity/serving → Save
3. **Photo:** upload or camera → AI suggests items + servings → confirm → Save
4. Entry appears in today's log and updates remaining calories

### Flow C — Analytics & Progress

1. Tap Dashboard → see Today / 7-day / 30-day graphs
2. Drill down to each day to see meal breakdowns and macros
3. Edit items or change goals from settings

---

## 4. Success Metrics (KPIs)

- **Day-1 Activation Rate:** % users who log at least 1 meal in first day
- **7-day Retention:** % active users after 7 days
- **DAU/MAU ratio** for engagement
- **Average time to log a meal** (target ≤ 10s for text; ≤ 15s for photo)
- **Calorie estimate accuracy** (internal QA comparing known meals, target >85%)
- **API response 95th percentile latency** (target <250ms for common queries)
- **Crash rate / error rate** (target <1%)
- **Conversion to premium** (if paid features introduced)

---

## 5. Technical Architecture

### High-Level Architecture

- **Frontend:** Next.js (React) with App Router, TypeScript, TailwindCSS
- **Backend / BaaS:** Supabase (Auth, Postgres, Storage, Edge Functions for server logic)
- **AI services:** Option A: On-device / cloud-run custom model; Option B: Google Vertex AI or OpenAI for image/ML tasks
- **Hosting:** Vercel for Next.js
- **Analytics & monitoring:** PostHog or Plausible for event tracking; Sentry for errors

**Architecture Diagram (text):**

```
User Browser ↔️ Next.js (Vercel) ↔ Supabase (Auth, Postgres, Storage, Edge Functions) ↔ AI APIs (OpenAI / Google Vision)
```

### Database Schema

**Tables:**
- `profiles` - User profile data (extends Supabase auth.users)
- `food_items` - Master database of foods
- `meals` - User-recorded meals
- `meal_items` - Join table (many items per meal)
- `user_goals` - Historical goal tracking
- `daily_logs` - Aggregated daily data for fast analytics

**Key Features:**
- Row Level Security (RLS) enabled on all user tables
- Indexes on `meals(user_id, meal_time)` and `daily_logs(user_id, day)`
- Foreign key constraints for data integrity

---

## 6. Development Roadmap

### Phase 0 — Prep (Complete ✅)
- ✅ Create Next.js project structure
- ✅ Create Supabase project, enable Auth, Postgres, Storage
- ✅ Seed `food_items` with common database

### Phase 1 — Project Setup (Complete ✅)
- ✅ Initialize Next.js app in Cursor
- ✅ Install dependencies: `@supabase/supabase-js`, `tailwindcss`, `@tanstack/react-query`, `recharts`, `date-fns`, `zod`
- ✅ Configure Tailwind & global layout
- ✅ Setup Supabase client & Auth handlers
- ✅ Implement basic layout and routing

### Phase 2 — Authentication & Core UI (Complete ✅)
- ✅ Implement sign-up / sign-in / password reset + OAuth (Google)
- ✅ Build profile settings & onboarding flow (collect height/weight/activity)
- ✅ Implement goal calculation service

### Phase 3 — CRUD for Meal Logging (Complete ✅)
- ✅ Create Food search UI (client-side search + server filtering)
- ✅ Build `Log Meal` flow (create meal, add items, compute calories)
- ✅ Implement `meal_items` editing and deletion
- ✅ Implement daily log aggregation (via API routes)

### Phase 4 — Analytics Dashboard & Polish (Complete ✅)
- ✅ Build dashboard with charts (7d, 30d)
- ✅ Add progress bars & macros breakdown
- ✅ Add settings, export CSV, and minor UX polish

### Phase 5 — AI Features + Testing (Pending)
- ⏳ Integrate image recognition (upload → process → suggest food_items)
- ⏳ Add suggestions endpoint for meal recommendations
- ⏳ Add voice logging prototype (web speech API + transcription)
- ⏳ Write E2E tests and run load tests on endpoints

### Phase 6 — Deployment & Production Hardening (Pending)
- ⏳ Configure Vercel deployment (env vars, secrets)
- ⏳ Configure Supabase production DB, backup, and RLS policies
- ⏳ Setup monitoring (Sentry), analytics, and alerting
- ⏳ Implement rate limiting on AI endpoints and cost control

---

## 7. Implementation Status

### Completed ✅

- [x] Database schema and migrations
- [x] Authentication (Email/Password + Google OAuth)
- [x] Food search API
- [x] Meal logging (create, read, delete)
- [x] Dashboard with 7-day analytics
- [x] TypeScript types and utilities
- [x] React hooks for data fetching
- [x] Basic UI components

### In Progress ⏳

- [ ] Image-based food recognition
- [ ] Meal editing
- [ ] Profile onboarding flow
- [ ] TDEE calculation integration

### Pending 📋

- [ ] Voice logging
- [ ] CSV export
- [ ] Premium features
- [ ] Health integrations

---

## 8. Deployment Checklist

### Vercel

1. Link GitHub repo to Vercel or deploy via Cursor push
2. Add environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) in project settings
3. Use Vercel Edge Functions or API Routes if needed. Keep service role key server-only
4. Configure automatic previews for PRs
5. Set up domain and SSL

### Supabase (Production)

- Enable backups & point-in-time recovery if available
- Configure RLS policies strictly
- Create API keys for monitoring and rotation
- Restrict storage public access; use signed URLs for images

### Monitoring

- Sentry for runtime errors
- PostHog for analytics events (e.g., `meal_logged`, `image_recognition_used`)
- Set alerts for error spikes and high AI API spend

---

## 9. Cost & Scaling Notes

- Supabase entry-level plan covers small user base. Watch DB row growth for `meal_items`
- AI image calls and LLM prompts are high-cost items—cache predictions and limit frequency
- Use server-side batching and rate limits for image processing

---

## 10. Next Steps

**Immediate Actions:**

1. Run database migrations in Supabase
2. Seed food_items table
3. Test authentication flow
4. Test meal logging end-to-end
5. Configure Google OAuth in Supabase dashboard

**Future Enhancements:**

1. Add image recognition API integration
2. Implement meal editing
3. Add profile onboarding wizard
4. Create CSV export functionality
5. Add voice logging prototype

---

**Document Version:** 1.0  
**Last Updated:** November 2025

