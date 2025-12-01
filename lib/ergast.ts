import prisma from './prisma';

type ErgastResponse<T> = {
  MRData: T;
};

const BASE = process.env.ERGAST_BASE_URL ?? 'https://ergast.com/api/f1';

function formatFetchError(url: string, err: unknown) {
  if (err instanceof Error) {
    const cause = (err as any).cause;
    const causeMsg = cause?.code ? ` (cause: ${cause.code}${cause.address ? ` ${cause.address}` : ''}${cause.port ? `:${cause.port}` : ''})` : '';
    return `${err.message}${causeMsg}`;
  }
  return `Unknown error while fetching ${url}`;
}

async function fetchJson<T>(url: string, options: { retries?: number; retryDelayMs?: number } = {}): Promise<T> {
  const { retries = 2, retryDelayMs = 400 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 * 60 } });
      if (!res.ok) throw new Error(`Failed to fetch ${url} (status ${res.status})`);
      return res.json();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) break;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries + 1} attempt(s): ${formatFetchError(url, lastError)}`);
}

function mapDriver(d: any) {
  return {
    driverId: d.driverId,
    code: d.code,
    givenName: d.givenName,
    familyName: d.familyName,
    dateOfBirth: new Date(d.dateOfBirth),
    nationality: d.nationality
  };
}

export async function getSeasons() {
  const data = await fetchJson<ErgastResponse<{ SeasonTable: { Seasons: any[] } }>>(`${BASE}/seasons.json?limit=100`);
  return data.MRData.SeasonTable.Seasons.map((s) => parseInt(s.season, 10)).reverse();
}

export async function getSeasonRaces(season: number) {
  // Try cache
  const dbSeason = await prisma.season.findUnique({ where: { year: season }, include: { races: { include: { circuit: true } } } });
  if (dbSeason?.races.length) return dbSeason.races;
  const data = await fetchJson<ErgastResponse<{ RaceTable: { Races: any[] } }>>(`${BASE}/${season}.json?limit=100`);
  return data.MRData.RaceTable.Races;
}

export async function getRaceResults(season: number, round: number) {
  const cache = await prisma.result.findMany({ where: { race: { season: { year: season }, round } }, include: { driver: true, constructor: true, race: { include: { circuit: true } } } });
  if (cache.length) return cache;
  const data = await fetchJson<ErgastResponse<{ RaceTable: { Races: any[] } }>>(`${BASE}/${season}/${round}/results.json?limit=60`);
  return data.MRData.RaceTable.Races[0]?.Results ?? [];
}

export async function getQualifyingResults(season: number, round: number) {
  const cache = await prisma.qualifyingResult.findMany({ where: { race: { season: { year: season }, round } }, include: { driver: true, constructor: true } });
  if (cache.length) return cache;
  const data = await fetchJson<ErgastResponse<{ RaceTable: { Races: any[] } }>>(`${BASE}/${season}/${round}/qualifying.json?limit=60`);
  return data.MRData.RaceTable.Races[0]?.QualifyingResults ?? [];
}

export async function getLapTimes(season: number, round: number, driverId?: string) {
  const cache = await prisma.lapTime.findMany({ where: { race: { season: { year: season }, round }, ...(driverId ? { driver: { driverId } } : {}) }, include: { driver: true } });
  if (cache.length) return cache;
  const driverQuery = driverId ? `/drivers/${driverId}` : '';
  const data = await fetchJson<ErgastResponse<{ RaceTable: { Races: any[] } }>>(`${BASE}/${season}/${round}/laps.json?limit=2000${driverQuery}`);
  const laps = data.MRData.RaceTable.Races[0]?.Laps ?? [];
  return laps;
}

export async function getDrivers(season?: number) {
  const whereSeason = season ? { season: { year: season } } : undefined;
  const cache = await prisma.driver.findMany({ where: whereSeason });
  if (cache.length) return cache;
  const url = season ? `${BASE}/${season}/drivers.json?limit=100` : `${BASE}/drivers.json?limit=1000`;
  const data = await fetchJson<ErgastResponse<{ DriverTable: { Drivers: any[] } }>>(url);
  return data.MRData.DriverTable.Drivers.map(mapDriver);
}

export async function getConstructors(season?: number) {
  const cache = await prisma.constructor.findMany();
  if (cache.length) return cache;
  const url = season ? `${BASE}/${season}/constructors.json?limit=60` : `${BASE}/constructors.json?limit=1000`;
  const data = await fetchJson<ErgastResponse<{ ConstructorTable: { Constructors: any[] } }>>(url);
  return data.MRData.ConstructorTable.Constructors;
}

export async function getDriverStandings(season: number) {
  const cache = await prisma.driverStanding.findMany({ where: { race: { season: { year: season } } }, include: { driver: true }, orderBy: { race: { round: 'desc' } }, take: 20 });
  if (cache.length) return cache;
  const data = await fetchJson<ErgastResponse<{ StandingsTable: { StandingsLists: any[] } }>>(`${BASE}/${season}/driverStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(season: number) {
  const cache = await prisma.constructorStanding.findMany({ where: { race: { season: { year: season } } }, include: { constructor: true }, orderBy: { race: { round: 'desc' } }, take: 20 });
  if (cache.length) return cache;
  const data = await fetchJson<ErgastResponse<{ StandingsTable: { StandingsLists: any[] } }>>(`${BASE}/${season}/constructorStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

export async function getRace(season: number, round: number) {
  const cache = await prisma.race.findFirst({ where: { season: { year: season }, round }, include: { circuit: true, season: true } });
  if (cache) return cache;
  const data = await fetchJson<ErgastResponse<{ RaceTable: { Races: any[] } }>>(`${BASE}/${season}/${round}.json`);
  return data.MRData.RaceTable.Races[0];
}
