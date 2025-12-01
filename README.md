# F1 Data Lab

An in-depth Formula 1 analytics experience built with Next.js 14, TypeScript, Tailwind CSS, Recharts, and a SQLite cache powered by Prisma. Data comes from the open Ergast API and can be synced locally for fast, repeatable analytics.

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

### Sync Ergast data into SQLite

A small helper script pulls a season from the Ergast API and hydrates the cache:

```bash
npm run sync:season -- 2024
```

You can re-run the script to refresh the same season; upserts keep entities in sync. The script fetches races, race results, and qualifying for the chosen season.

If the Ergast API is blocked from your network, you can either point to an alternate host or seed from an offline JSON snapshot:

```bash
# Override host
ERGAST_BASE_URL=https://your-mirror.example.com/api/f1 npm run sync:season -- 2024

# Use bundled offline sample (round 1 of 2024) to validate the app without network access
npm run sync:season -- 2024 --offline fixtures/sample-season-2024.json
```

The fetcher retries automatically, but a hard block will surface as a connection error; offline mode keeps the UI explorable in locked-down environments.

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
- Prisma ORM with SQLite cache for Ergast data
- Modular data fetchers in `lib/ergast.ts` and analytics helpers in `lib/analytics.ts`

