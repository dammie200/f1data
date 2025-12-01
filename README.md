# F1 Data Lab

An in-depth Formula 1 analytics experience built with Next.js 14, TypeScript, Tailwind CSS, Recharts, and a SQLite cache powered by Prisma. Data now comes from a FastF1-style JSON feed by default (no toggles required). A small offline snapshot is bundled to explore the UI without network access.

## Getting started

```bash
npm install
```

### Database & Prisma

Prisma uses SQLite by default (`prisma/dev.db`). To create the database and client types:

```bash
npm run migrate
```

This runs `prisma migrate dev` with the bundled `schema.prisma` that captures drivers, constructors, circuits, races, results, qualifying, lap times, pit stops, and standings.

### Sync race data into SQLite (FastF1 feed)

A helper script pulls a season from a FastF1-compatible feed and hydrates the cache:

```bash
npm run sync:season -- 2024
```

You can re-run the script to refresh the same season; upserts keep entities in sync. The script fetches races, race results, and qualifying for the chosen season.

The feed host defaults to `https://api.fastf1.dev/v1/`. Override it with `FASTF1_BASE_URL` if you run a mirror or a local cache.

If you’re offline or the FastF1 feed is blocked, seed from the bundled JSON snapshot:

```bash
npm run sync:season -- 2024 --offline fixtures/sample-season-2024.json
```

### Development server

```bash
npm run dev
```

Then open http://localhost:3000. The App Router layout includes:

- **Home dashboard** with standings, upcoming race, points chart, and fun facts
- **Season pages** (`/seasons/[year]`) with competitiveness metrics and title battle chart
- **Race pages** (`/races/[year]/[round]`) summarising results, movers, qualifying, and track evolution
- **Driver, constructor, and circuit hubs** with season selectors, charts, and tables

### Testing lint/build

Basic Next.js linting and build commands are available:

```bash
npm run lint
npm run build
```

### Tech highlights

- Next.js 14 App Router + TypeScript
- Tailwind CSS styling
- Recharts for interactive charts
- Prisma ORM with SQLite cache for FastF1-flavoured data
- Modular data fetchers in `lib/data.ts` and analytics helpers in `lib/analytics.ts`
