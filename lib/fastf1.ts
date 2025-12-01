import fs from 'fs';
import path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'data', 'fastf1');
const SNAPSHOT_PATH = path.join(process.cwd(), 'fixtures', 'sample-season-2024.json');

type OfflineSeason = {
  season: number;
  races: OfflineRace[];
};

type OfflineRace = {
  season: string;
  round: string;
  raceName: string;
  date: string;
  Circuit: { circuitId: string; circuitName: string; Location?: { locality?: string; country?: string } };
  Results?: any[];
  QualifyingResults?: any[];
  LapTimes?: Record<string, any[]>;
};

function readSeasonExport(season: number): OfflineSeason {
  const exported = path.join(EXPORT_DIR, `season-${season}.json`);
  if (fs.existsSync(exported)) {
    return JSON.parse(fs.readFileSync(exported, 'utf-8')) as OfflineSeason;
  }

  if (season === 2024 && fs.existsSync(SNAPSHOT_PATH)) {
    return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8')) as OfflineSeason;
  }

  throw new Error(
    `Geen FastF1-export gevonden voor ${season}. Draai \"python scripts/export_fastf1.py ${season} --out data/fastf1/season-${season}.json\" om data aan te leveren.`
  );
}

export async function getSeasonRacesFastf1(season: number) {
  return readSeasonExport(season).races;
}

export async function getRaceResultsFastf1(season: number, round: number) {
  const seasonData = readSeasonExport(season);
  const race = seasonData.races.find((r) => Number(r.round) === Number(round));
  return race?.Results ?? [];
}

export async function getQualifyingResultsFastf1(season: number, round: number) {
  const seasonData = readSeasonExport(season);
  const race = seasonData.races.find((r) => Number(r.round) === Number(round));
  return race?.QualifyingResults ?? [];
}

export async function getDriverStandingsFastf1(season: number) {
  const seasonData = readSeasonExport(season);
  const totals = new Map<string, { points: number; wins: number; driver: any }>();

  seasonData.races.forEach((race) => {
    race.Results?.forEach((res) => {
      const key = res.Driver.driverId;
      const entry = totals.get(key) ?? { points: 0, wins: 0, driver: res.Driver };
      entry.points += Number(res.points ?? 0);
      if (res.position === '1' || res.position === 1) entry.wins += 1;
      totals.set(key, entry);
    });
  });

  return Array.from(totals.values())
    .sort((a, b) => b.points - a.points)
    .map((val, idx) => ({ position: idx + 1, points: val.points, wins: val.wins, Driver: val.driver }));
}

export async function getConstructorStandingsFastf1(season: number) {
  const seasonData = readSeasonExport(season);
  const totals = new Map<string, { points: number; wins: number; constructor: any }>();

  seasonData.races.forEach((race) => {
    race.Results?.forEach((res) => {
      const key = res.Constructor.constructorId;
      const entry = totals.get(key) ?? { points: 0, wins: 0, constructor: res.Constructor };
      entry.points += Number(res.points ?? 0);
      if (res.position === '1' || res.position === 1) entry.wins += 1;
      totals.set(key, entry);
    });
  });

  return Array.from(totals.values())
    .sort((a, b) => b.points - a.points)
    .map((val, idx) => ({ position: idx + 1, points: val.points, wins: val.wins, Constructor: val.constructor }));
}

export async function getDriversFastf1(season?: number) {
  const seasonData = readSeasonExport(season ?? new Date().getFullYear());
  const drivers = new Map<string, any>();
  seasonData.races.forEach((race) => {
    race.Results?.forEach((res) => drivers.set(res.Driver.driverId, res.Driver));
    race.QualifyingResults?.forEach((res) => drivers.set(res.Driver.driverId, res.Driver));
  });
  return Array.from(drivers.values());
}

export async function getConstructorsFastf1(season?: number) {
  const seasonData = readSeasonExport(season ?? new Date().getFullYear());
  const teams = new Map<string, any>();
  seasonData.races.forEach((race) => {
    race.Results?.forEach((res) => teams.set(res.Constructor.constructorId, res.Constructor));
  });
  return Array.from(teams.values());
}

export async function getRaceFastf1(season: number, round: number) {
  const seasonData = readSeasonExport(season);
  return seasonData.races.find((r) => Number(r.round) === Number(round));
}

export async function getLapTimesFastf1(season: number, round: number, driverId?: string) {
  const seasonData = readSeasonExport(season);
  const race = seasonData.races.find((r) => Number(r.round) === Number(round));
  if (!race?.LapTimes) return [];
  const all = Object.entries(race.LapTimes).flatMap(([id, laps]) =>
    (laps as any[]).map((lap) => ({
      number: lap.lap,
      Timings: [
        {
          driverId: id,
          time: lap.time,
          position: lap.position ?? null
        }
      ]
    }))
  );
  return driverId ? all.filter((lap) => lap.Timings[0].driverId === driverId) : all;
}
