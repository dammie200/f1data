import prisma from './prisma';
import {
  getSeasonRacesFastf1,
  getRaceResultsFastf1,
  getQualifyingResultsFastf1,
  getLapTimesFastf1,
  getDriversFastf1,
  getConstructorsFastf1,
  getDriverStandingsFastf1,
  getConstructorStandingsFastf1,
  getRaceFastf1,
  listOfflineSeasons,
  getDefaultFastf1Season
} from './fastf1';

function distinctYears(values: number[]) {
  return Array.from(new Set(values)).sort((a, b) => b - a);
}

export async function getSeasons() {
  const cached = await prisma.season.findMany({ select: { year: true } });
  const cachedYears = cached.map((s) => s.year);
  const offlineYears = listOfflineSeasons();

  return distinctYears([...cachedYears, ...offlineYears]);
}

export async function getSeasonRaces(season: number) {
  const dbSeason = await prisma.season.findUnique({ where: { year: season }, include: { races: { include: { circuit: true } } } });
  if (dbSeason?.races.length) return dbSeason.races;
  return getSeasonRacesFastf1(season);
}

export async function getRaceResults(season: number, round: number, sessionKey?: number) {
  const cache = await prisma.result.findMany({
    where: { race: { season: { year: season }, round } },
    include: { driver: true, constructor: true, race: { include: { circuit: true } } }
  });
  if (cache.length) return cache;
  return getRaceResultsFastf1(season, round, sessionKey);
}

export async function getQualifyingResults(season: number, round: number, sessionKey?: number) {
  const cache = await prisma.qualifyingResult.findMany({ where: { race: { season: { year: season }, round } }, include: { driver: true, constructor: true } });
  if (cache.length) return cache;
  return getQualifyingResultsFastf1(season, round, sessionKey);
}

export async function getLapTimes(season: number, round: number, driverId?: string) {
  const cache = await prisma.lapTime.findMany({
    where: { race: { season: { year: season }, round }, ...(driverId ? { driver: { driverId } } : {}) },
    include: { driver: true }
  });
  if (cache.length) return cache;
  return getLapTimesFastf1(season, round, driverId);
}

export async function getDrivers(season?: number) {
  const whereSeason = season ? { season: { year: season } } : undefined;
  const cache = await prisma.driver.findMany({ where: whereSeason });
  if (cache.length) return cache;
  return getDriversFastf1(season ?? getDefaultFastf1Season());
}

export async function getConstructors(season?: number) {
  const cache = await prisma.constructor.findMany();
  if (cache.length) return cache;
  return getConstructorsFastf1(season ?? getDefaultFastf1Season());
}

export async function getDriverStandings(season: number) {
  const cache = await prisma.driverStanding.findMany({
    where: { race: { season: { year: season } } },
    include: { driver: true },
    orderBy: { race: { round: 'desc' } },
    take: 20
  });
  if (cache.length) return cache;
  return getDriverStandingsFastf1(season);
}

export async function getConstructorStandings(season: number) {
  const cache = await prisma.constructorStanding.findMany({
    where: { race: { season: { year: season } } },
    include: { constructor: true },
    orderBy: { race: { round: 'desc' } },
    take: 20
  });
  if (cache.length) return cache;
  return getConstructorStandingsFastf1(season);
}

export async function getRace(season: number, round: number) {
  const cache = await prisma.race.findFirst({ where: { season: { year: season }, round }, include: { circuit: true, season: true } });
  if (cache) return cache;
  return getRaceFastf1(season, round);
}
