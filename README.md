# Discord Clone – Full Stack

A minimal yet functional Discord-like app with authentication, servers, channels, and realtime chat.

## Tech Stack
- Frontend: Next.js 14, React 18, TailwindCSS (dark mode default)
- Backend: Node.js (Express), Socket.io
- Database: PostgreSQL + Prisma ORM
- Auth: JWT access + refresh tokens, bcrypt password hashing

## Monorepo Structure
```
frontend/
backend/
  prisma/
```

## Prerequisites
- Node.js 18+ (or 20+ recommended)
- PostgreSQL 14+ (or use Docker)
- npm 10+

## Environment Variables
Backend `.env` (copy from `.env.example`):
```
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/discord_clone?schema=public
JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

Frontend env (optional):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## Local Development (without Docker)
1. Start PostgreSQL locally and create database `discord_clone`.
2. Backend:
   - `cd backend`
   - `cp .env.example .env`
   - `npm i`
   - `npx prisma generate`
   - `npx prisma db push`
   - `npm run seed`
   - `npm run dev`
3. Frontend:
   - `cd ../frontend`
   - `npm i`
   - `npm run dev`
4. Open `http://localhost:3000`

Seed users: `alice@example.com` / `password123`, `bob@example.com` / `password123`.

## Local Development (with Docker for DB + Backend)
If you have Docker:
- `docker compose up -d db`
- Update backend `DATABASE_URL` to use the service host: `postgresql://postgres:postgres@db:5432/discord_clone?schema=public`
- `docker compose up --build backend`

## Deployment
- Backend: Build the Docker image and deploy to your host. Ensure environment variables are set and Postgres reachable.
- Frontend: Deploy to Vercel. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to your backend URL.

## Features Implemented
- Authentication: register, login, refresh token
- User profiles: username, avatar, status (presence via sockets)
- Servers: create, join by invite, leave; owner and admin roles
- Channels: list and create (owner/admin)
- Chat: realtime messages, edit/delete, history persisted
- Presence: online/offline broadcast on connect/disconnect

## Notes
- Voice channels are placeholders via `ChannelType.VOICE` in schema.
- Email validation performed server-side via zod.
- Permissions enforced for channel creation and message ownership.

## Troubleshooting
- If Prisma cannot reach DB, ensure Postgres is running and `DATABASE_URL` is correct.
- If sockets fail, check CORS and that the frontend uses the correct `NEXT_PUBLIC_WS_URL`.