import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getSeasonRaces, getRaceResults, getQualifyingResults } from '../lib/ergast';
import prisma from '../lib/prisma';

type OfflineRace = {
  season: string;
  round: string;
  raceName: string;
  date: string;
  Circuit: { circuitId: string; circuitName: string; Location?: { locality?: string; country?: string } };
  Results?: any[];
  QualifyingResults?: any[];
};

type OfflineSeason = {
  season: number;
  races: OfflineRace[];
};

async function loadOfflineSeason(filePath: string): Promise<OfflineSeason> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Offline file not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed?.season || !parsed?.races) {
    throw new Error('Offline file must include { season, races }');
  }
  return parsed as OfflineSeason;
}

async function main() {
  const args = process.argv.slice(2);
  const seasonArg = args.find((a) => !a.startsWith('--'));
  if (!seasonArg) throw new Error('Usage: npm run sync:season -- <year> [--offline path/to/file.json]');

  const offlineFlag = args.find((a) => a === '--offline' || a.startsWith('--offline='));
  const offlinePath = offlineFlag?.includes('=') ? offlineFlag.split('=')[1] : undefined;
  const season = Number(seasonArg);

  const offlineSeason = offlinePath ? await loadOfflineSeason(offlinePath) : undefined;
  if (offlineSeason && offlineSeason.season !== season) {
    console.warn(`Offline file season ${offlineSeason.season} does not match requested ${season}; using offline season value.`);
  }

  const races = offlineSeason?.races ?? (await getSeasonRaces(season));
  const resolvedSeason = offlineSeason?.season ?? season;
  const seasonRecord = await prisma.season.upsert({ where: { year: resolvedSeason }, create: { year: resolvedSeason }, update: {} });

  for (const race of races) {
    const circuit = await prisma.circuit.upsert({
      where: { circuitId: race.Circuit.circuitId },
      create: {
        circuitId: race.Circuit.circuitId,
        name: race.Circuit.circuitName,
        location: race.Circuit.Location?.locality,
        country: race.Circuit.Location?.country
      },
      update: {}
    });

    const raceRecord = await prisma.race.upsert({
      where: { seasonId_round: { seasonId: seasonRecord.id, round: Number(race.round) } },
      create: {
        seasonId: seasonRecord.id,
        round: Number(race.round),
        raceName: race.raceName,
        date: new Date(race.date),
        circuitId: circuit.id
      },
      update: {
        raceName: race.raceName,
        date: new Date(race.date),
        circuitId: circuit.id
      }
    });

    const results = offlineSeason ? race.Results ?? [] : await getRaceResults(season, race.round);
    for (const res of results) {
      const driver = await prisma.driver.upsert({
        where: { driverId: res.Driver.driverId },
        create: {
          driverId: res.Driver.driverId,
          code: res.Driver.code,
          givenName: res.Driver.givenName,
          familyName: res.Driver.familyName,
          dateOfBirth: new Date(res.Driver.dateOfBirth),
          nationality: res.Driver.nationality
        },
        update: {
          code: res.Driver.code,
          nationality: res.Driver.nationality
        }
      });

      const constructor = await prisma.constructor.upsert({
        where: { constructorId: res.Constructor.constructorId },
        create: {
          constructorId: res.Constructor.constructorId,
          name: res.Constructor.name,
          nationality: res.Constructor.nationality
        },
        update: {
          nationality: res.Constructor.nationality,
          name: res.Constructor.name
        }
      });

      await prisma.result.upsert({
        where: { raceId_driverId: { raceId: raceRecord.id, driverId: driver.id } },
        create: {
          raceId: raceRecord.id,
          driverId: driver.id,
          constructorId: constructor.id,
          position: res.position ? Number(res.position) : null,
          grid: res.grid ? Number(res.grid) : null,
          laps: res.laps ? Number(res.laps) : null,
          status: res.status,
          points: res.points ? Number(res.points) : null,
          time: res.Time?.time,
          fastestLapRank: res.FastestLap?.rank ? Number(res.FastestLap.rank) : null,
          fastestLapTime: res.FastestLap?.Time?.time ?? null
        },
        update: {
          position: res.position ? Number(res.position) : null,
          grid: res.grid ? Number(res.grid) : null,
          laps: res.laps ? Number(res.laps) : null,
          status: res.status,
          points: res.points ? Number(res.points) : null,
          time: res.Time?.time,
          fastestLapRank: res.FastestLap?.rank ? Number(res.FastestLap.rank) : null,
          fastestLapTime: res.FastestLap?.Time?.time ?? null
        }
      });
    }

    const quali = offlineSeason ? race.QualifyingResults ?? [] : await getQualifyingResults(season, race.round);
    for (const res of quali) {
      const driver = await prisma.driver.upsert({
        where: { driverId: res.Driver.driverId },
        create: {
          driverId: res.Driver.driverId,
          code: res.Driver.code,
          givenName: res.Driver.givenName,
          familyName: res.Driver.familyName,
          dateOfBirth: new Date(res.Driver.dateOfBirth),
          nationality: res.Driver.nationality
        },
        update: {
          code: res.Driver.code,
          nationality: res.Driver.nationality
        }
      });

      const constructor = await prisma.constructor.upsert({
        where: { constructorId: res.Constructor.constructorId },
        create: { constructorId: res.Constructor.constructorId, name: res.Constructor.name, nationality: res.Constructor.nationality },
        update: { name: res.Constructor.name, nationality: res.Constructor.nationality }
      });

      await prisma.qualifyingResult.upsert({
        where: { raceId_driverId: { raceId: raceRecord.id, driverId: driver.id } },
        create: {
          raceId: raceRecord.id,
          driverId: driver.id,
          constructorId: constructor.id,
          position: res.position ? Number(res.position) : null,
          q1: res.Q1,
          q2: res.Q2,
          q3: res.Q3
        },
        update: {
          position: res.position ? Number(res.position) : null,
          q1: res.Q1,
          q2: res.Q2,
          q3: res.Q3
        }
      });
    }
  }

  console.log(`Synced ${races.length} races for ${resolvedSeason}${offlineSeason ? ' (offline source)' : ''}`);
}

main()
  .catch((err) => {
    console.error('\nFailed to sync season data.');
    console.error('This typically happens if the Ergast API is unreachable from your network or the base URL is blocked.');
    console.error('You can override the API host with ERGAST_BASE_URL, retry on a different network, or pass --offline <file>.');
    console.error('Example offline seed: npm run sync:season -- 2024 --offline fixtures/sample-season-2024.json');
    console.error('Underlying error:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
