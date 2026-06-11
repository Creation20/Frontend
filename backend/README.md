# LexiAid Backend API

Production-grade REST API built with **Fastify**, **TypeScript**, **PostgreSQL** (via Prisma), and free AI services.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Fastify 4 + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh) + bcrypt |
| AI | Google Gemini 1.5 Flash (free) |
| Definitions | Free Dictionary API (no key) |
| OCR | Tesseract.js (server-side, free) |
| File Processing | pdf-parse |
| Validation | Zod |

---

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** running locally, OR a free cloud DB (see options below)
- **Google AI Studio API Key** (free) — get one at https://aistudio.google.com

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env` and fill in:

```env
# Required
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/lexiaid"
JWT_ACCESS_SECRET="generate-with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
JWT_REFRESH_SECRET="generate-with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
GEMINI_API_KEY="your-key-from-aistudio.google.com"
```

### 3. Set up PostgreSQL

**Option A — Local PostgreSQL:**
```bash
# macOS (Homebrew)
brew install postgresql && brew services start postgresql
createdb lexiaid
```

**Option B — Free Cloud (Neon.tech, no credit card):**
1. Sign up at https://neon.tech
2. Create a project → copy the connection string
3. Paste it as `DATABASE_URL` in `.env`

**Option C — Free Cloud (Supabase):**
1. Sign up at https://supabase.com
2. Project Settings → Database → Connection string (URI mode)
3. Paste as `DATABASE_URL`

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. (Optional) Seed demo data

```bash
npm run db:seed
# Demo login: demo@lexiaid.app / lexiaid123
```

### 6. Start development server

```bash
npm run dev
# 🚀 LexiAid API running at http://127.0.0.1:3000
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Health Check
```
GET /health
```

### Auth
```
POST /auth/register      — Create account
POST /auth/login         — Login (returns access + refresh tokens)
POST /auth/refresh       — Refresh access token
POST /auth/logout        — Invalidate refresh token
```

### Users (🔒 JWT required)
```
GET    /users/me           — Full profile
PATCH  /users/me           — Update name, avatar, etc.
GET    /users/me/stats     — WPM history, accuracy, streak
POST   /users/me/xp        — Award XP for activity
POST   /users/me/badge     — Award a badge
```

### Documents (🔒 JWT required)
```
GET    /documents                     — List all (search: ?q=)
GET    /documents/recommendations     — Personalized picks
POST   /documents                     — Upload PDF or TXT
GET    /documents/:id                 — Full document content
PATCH  /documents/:id/progress        — Update reading progress
DELETE /documents/:id                 — Delete document
POST   /documents/:id/bookmark        — Add bookmark
GET    /documents/:id/quiz            — Get/generate quiz
GET    /documents/:id/flashcards      — Get flashcards
POST   /documents/:id/quiz-result     — Save quiz result + award XP
```

### AI (🔒 JWT required)
```
POST   /ai/simplify          — Simplify any text
POST   /ai/summarize         — TL;DR for a document
POST   /ai/chat              — Ask Lexi (context-aware chat)
POST   /ai/generate-quiz     — Force-generate new quiz
GET    /ai/word/:word        — Word definition + syllables + etymology
POST   /ai/scan              — OCR image → text + simplification (+100 XP)
POST   /ai/pronunciation     — Pronunciation guide for a word
```

### Vocabulary (🔒 JWT required)
```
GET    /vocabulary              — List (filter: ?filter=mastered|learning|all)
POST   /vocabulary              — Add word (auto-fetches definition)
PATCH  /vocabulary/:word/mastery — Toggle mastered (+50 XP)
GET    /vocabulary/challenge    — 5 random words for matching game
```

### Performance (🔒 JWT required)
```
POST   /performance/session      — End reading session (WPM + XP + streak)
GET    /performance/weekly-wpm   — 7-day WPM chart data
GET    /performance/report       — Full progress report JSON
GET    /performance/sessions     — Session log history (paginated)
```

### Settings (🔒 JWT required)
```
GET    /settings           — Fetch settings
PUT    /settings           — Save settings
POST   /settings/reset     — Factory reset
POST   /settings/diagnostic — Apply style preset (standard|visual-comfort|high-focus)
```

---

## Authentication Flow

1. `POST /auth/register` → receive `{ accessToken, refreshToken }`
2. Use `Authorization: Bearer <accessToken>` header on all protected routes
3. When access token expires (15 min), call `POST /auth/refresh` with `{ refreshToken }`
4. On logout: call `POST /auth/logout` with `{ refreshToken }`

---

## XP System

| Activity | XP Awarded |
|---|---|
| Words read | 1 XP per word |
| Correct quiz answer | +30 XP |
| Quiz completion bonus | +50 XP |
| Document scan (OCR) | +100 XP |
| Vocabulary word mastered | +50 XP |
| Vocab challenge correct | +30 XP |
| Vocab challenge complete | +50 XP |
| Summary generated | +20 XP |

Level formula: `level = floor(totalXP / 1000) + 1`

---

## File Upload

```bash
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@/path/to/document.pdf" \
  -F "title=My Document" \
  -F "subject=Biology" \
  -F "author=Dr. Smith" \
  -F "category=lecture"
```

---

## Production Deployment

```bash
npm run build
npm run start
```

Set `NODE_ENV=production` and use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/server.js --name lexiaid-api
```

---

## Free AI Services Summary

| Service | Usage | Limits |
|---|---|---|
| **Gemini 1.5 Flash** | Simplify, summarize, chat, quiz, flashcards | 15 req/min, 1M tokens/day |
| **Free Dictionary API** | Word definitions + syllables | Unlimited (no key) |
| **Tesseract.js** | OCR (image → text) | Unlimited (runs locally) |
