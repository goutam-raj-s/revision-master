# Revision Master — Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

## Quick Start

```bash
# 1. Install dependencies (already done)
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local and set MONGODB_URI

# 3. Start MongoDB (local)
mongod --dbpath /usr/local/var/mongodb

# 4. Initialize DB indexes (first time only)
curl "http://localhost:3000/api/init?secret=<your-BETTER_AUTH_SECRET>"

# 5. Run development server
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/revision-master` |
| `BETTER_AUTH_SECRET` | Session signing secret (min 32 chars) | `super-secret-local-dev-key-change-in-production-32chars` |
| `BETTER_AUTH_URL` | App base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |
| `GEMINI_API_KEY` | Server-level Gemini key (optional, users can set their own) | — |

## First Use

1. Visit `http://localhost:3000/register` to create your account
2. Add your first Google Doc at `/documents/new`
3. Check your dashboard at `/dashboard`

## Make yourself an admin

Connect to MongoDB and run:
```javascript
use revision-master
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB (native driver, singleton pool)
- **Auth:** Custom session-based auth (no heavy library)
- **UI:** Tailwind CSS v4 + Radix UI primitives + shadcn/ui pattern
- **State:** Zustand (client) + Server Actions + React cache
- **Design:** Zen Productivity (Mint Tint) — #f1f5f2 canvas, emerald accents

## Production Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set all env vars in Vercel project settings
4. Deploy — MongoDB Atlas recommended for prod
5. After first deploy, hit `/api/init?secret=<BETTER_AUTH_SECRET>` to create indexes
