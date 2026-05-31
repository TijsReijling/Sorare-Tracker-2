# Sorare World Cup 2026 Tracker

Track which of your Sorare cards are playing at the 2026 FIFA World Cup and see their exact fixture dates.

## How it works

- You enter your Sorare credentials in the login form
- The **Next.js backend** (API routes) handles all Sorare API calls server-side — no CORS issues
- Your credentials are never stored; only the session JWT token is kept in memory
- Your cards are matched against all 48 World Cup teams across 12 groups

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

### 3. Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

That's it — Vercel auto-detects Next.js and deploys in ~1 minute.

## Features

- 🔐 Secure server-side Sorare authentication
- ⚽ Matches your cards to all 12 World Cup groups (A–L)
- 📅 Shows exact group stage fixture dates per player
- 🎨 Rarity-coloured card display (Common → Unique)
- 🔍 Filter by position and group
- 💰 Displays current market price per card
- 📱 Responsive layout

## World Cup Groups (2026)

| Group | Teams |
|-------|-------|
| A | Mexico, South Africa, South Korea, Czechia |
| B | Canada, Bosnia and Herzegovina, Qatar, Switzerland |
| C | Brazil, Morocco, Haiti, Scotland |
| D | USA, Paraguay, Australia, Turkey |
| E | Germany, Curaçao, Ivory Coast, Ecuador |
| F | Netherlands, Japan, Tunisia, Denmark |
| G | Belgium, Egypt, Iran, New Zealand |
| H | Spain, Cape Verde, Saudi Arabia, Uruguay |
| I | France, Senegal, Norway, Algeria |
| J | Argentina, Jordan, Austria, DR Congo |
| K | Portugal, Colombia, Uzbekistan, DR Congo |
| L | England, Croatia, Ghana, Panama |

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Sorare GraphQL API** — called server-side to bypass CORS
