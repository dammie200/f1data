# F1 Data Lab

An in-depth Formula 1 analytics experience built with Next.js 14, TypeScript, Tailwind CSS, Recharts, and a SQLite cache powered by Prisma. Data now comes from **local FastF1 exports** (the FastF1 Python tool, not a hosted API). A small offline snapshot is bundled to explore the UI without network access.

## Getting started

```bash
npm install
```

Install the FastF1 Python tooling used for data export (requires Python 3.10+):

```bash
python -m pip install -r scripts/requirements.txt
```

### Database & Prisma

Prisma uses SQLite by default (`prisma/dev.db`). To create the database and client types:

```bash
npm run migrate
```

This runs `prisma migrate dev` with the bundled `schema.prisma` that captures drivers, constructors, circuits, races, results, qualifying, lap times, pit stops, and standings.

### Sync race data into SQLite (FastF1 export files)

The app expects FastF1 data that you export yourself (FastF1 is a Python tool, not a web API). Workflow:

1) Export a season to JSON with FastF1:

```bash
python scripts/export_fastf1.py 2024 --cache .fastf1-cache --out data/fastf1/season-2024.json
```

If you see `ModuleNotFoundError: No module named 'fastf1'`, ensure you've installed the Python requirements from `scripts/requirements.txt` as shown above.

2) Hydrate SQLite from that export with **one input** (the year). The script auto-fills everything else:

```bash
npm run sync:season -- 2024
```

What happens automatically now:

- Looks for `data/fastf1/season-<year>.json`
- If missing, falls back to the bundled snapshot (`fixtures/sample-season-2024.json`)
- Lists which seasons are available so you immediately know what the app can load
- Writes any fatal error details to `logs/sync-error.log` so you can share a single file when something fails

You can re-run the sync to refresh the same season; upserts keep entities consistent. If you really need another export path, you can still pass it explicitly:

```bash
npm run sync:season -- 2023 --offline data/fastf1/season-2023.json
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
