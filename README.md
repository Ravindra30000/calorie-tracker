# BiteTrack - Calorie Tracker & Nutrition Coach

A modern, AI-assisted calorie tracker built with Next.js, TypeScript, and Supabase.

## Features

- 🔐 **Authentication** - Email/Password and Google OAuth
- 🍽️ **Meal Logging** - Quick food search and meal tracking
- 📊 **Dashboard** - Daily calorie summary and progress tracking
- 📈 **Analytics** - 7-day trends and visual charts
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Charts:** Recharts
- **State Management:** TanStack Query
- **AI:** Open Router (free models: Llama, Mistral, LLaVA)

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Prerequisites

- Node.js 18+ 
- Supabase account
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations in Supabase
5. Start dev server: `npm run dev`

## Project Structure

```
bitetrack/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and clients
│   └── utils/           # Helper functions
├── supabase-migrations.sql
├── supabase-seed.sql
└── supabase-trigger.sql
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
