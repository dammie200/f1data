import fs from 'fs';
import path from 'path';

const BASE = process.env.FASTF1_BASE_URL ?? 'https://api.fastf1.dev/v1/';
const OFFLINE_SNAPSHOT = path.join(process.cwd(), 'fixtures', 'sample-season-2024.json');

type OfflineSeason = {
  season: number;
  races: any[];
};

type OfflineRace = {
  season: string;
  round: string;
  raceName: string;
  date: string;
  Circuit: { circuitId: string; circuitName: string; Location?: { locality?: string; country?: string } };
  Results?: any[];
  QualifyingResults?: any[];
  sessionKey?: number;
};

function loadOfflineSeason(season: number): OfflineSeason | null {
  if (!fs.existsSync(OFFLINE_SNAPSHOT)) return null;
  const raw = fs.readFileSync(OFFLINE_SNAPSHOT, 'utf-8');
  const parsed = JSON.parse(raw) as OfflineSeason;
  if (parsed.season !== season) return null;
  return parsed;
}

function buildUrl(pathname: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(pathname.replace(/^\//, ''), BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FastF1 request failed for ${url} (status ${res.status})`);
  }
  return res.json();
}

async function withOfflineFallback<T>(season: number, loader: () => Promise<T>): Promise<T> {
  try {
    return await loader();
  } catch (err) {
    const offline = loadOfflineSeason(season);
    if (offline) {
      console.warn(`FastF1 fetch failed; falling back to offline snapshot for ${season}`);
      // @ts-expect-error allow returning partial data from snapshot
      return offline;
    }
    throw err;
  }
}

function teamId(name?: string | null) {
  if (!name) return 'unknown-team';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'unknown-team';
}

function mapDriverFromResult(r: any) {
  const fullName: string | undefined = r.driver_full_name ?? r.driver_name;
  const [givenName, ...rest] = (fullName ?? '').split(' ');
  const familyName = rest.join(' ').trim();
  return {
    driverId: String(r.driver_number ?? r.driver_id ?? fullName ?? Math.random()),
    code: r.driver_code ?? r.driver_short_name ?? givenName?.slice(0, 3)?.toUpperCase(),
    givenName: givenName || fullName || 'Unknown',
    familyName: familyName || '',
    dateOfBirth: r.driver_dob ? new Date(r.driver_dob) : undefined,
    nationality: r.country_name ?? r.driver_nationality ?? 'Unknown'
  };
}

export async function getSeasonRacesFastf1(season: number) {
  const offline = loadOfflineSeason(season);
  if (offline) return offline.races as OfflineRace[];

  return withOfflineFallback<OfflineRace[]>(season, async () => {
    const url = buildUrl('sessions', { year: season, session_name: 'Race' });
    const sessions = await fetchJson<any[]>(url);
    const sorted = sessions.sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
    return sorted.map((session, idx) => ({
      season: String(season),
      round: String(idx + 1),
      raceName: session.meeting_name ?? session.session_name ?? 'Race',
      date: session.date_start,
      Circuit: {
        circuitId: String(session.circuit_key ?? session.meeting_key ?? idx + 1),
        circuitName: session.circuit_short_name ?? session.circuit_name ?? session.meeting_name ?? 'Circuit',
        Location: { locality: session.location ?? session.country_code, country: session.country_name ?? session.country_code }
      },
      sessionKey: session.session_key,
      meetingKey: session.meeting_key
    }));
  });
}

async function resolveRaceSession(season: number, round: number, sessionKey?: number) {
  if (sessionKey) return sessionKey;
  const races = await getSeasonRacesFastf1(season);
  const match = races.find((r) => Number(r.round) === Number(round));
  return (match as any)?.sessionKey;
}

export async function getRaceResultsFastf1(season: number, round: number, sessionKey?: number) {
  const offline = loadOfflineSeason(season);
  if (offline) {
    const race = offline.races.find((r) => Number(r.round) === Number(round));
    return race?.Results ?? [];
  }

  const resolvedSession = await resolveRaceSession(season, round, sessionKey);
  if (!resolvedSession) return [];
  return withOfflineFallback(season, async () => {
    const url = buildUrl('results', { session_key: resolvedSession, order: 'position' });
    const results = await fetchJson<any[]>(url);
    return results.map((res) => {
      const driver = mapDriverFromResult(res);
      const constructorName = res.team_name ?? res.team ?? 'Unknown Team';
      return {
        position: res.position ?? res.classified_position ?? null,
        grid: res.grid_position ?? null,
        laps: res.laps_completed ?? res.lap_count ?? null,
        status: res.result_status ?? res.status ?? 'Finished',
        points: res.points ?? null,
        Time: res.time ?? undefined,
        FastestLap: res.fastest_lap_time
          ? { rank: res.fastest_lap_rank ?? null, Time: { time: res.fastest_lap_time } }
          : undefined,
        Driver: driver,
        Constructor: {
          constructorId: teamId(constructorName),
          name: constructorName,
          nationality: res.country_name ?? 'Unknown'
        }
      };
    });
  });
}

export async function getQualifyingResultsFastf1(season: number, round: number, sessionKey?: number) {
  const offline = loadOfflineSeason(season);
  if (offline) {
    const race = offline.races.find((r) => Number(r.round) === Number(round));
    return race?.QualifyingResults ?? [];
  }

  const resolvedSession = await resolveRaceSession(season, round, sessionKey);
  if (!resolvedSession) return [];
  return withOfflineFallback(season, async () => {
    const sessionsUrl = buildUrl('sessions', { session_key: resolvedSession });
    const [raceSession] = await fetchJson<any[]>(sessionsUrl);
    if (!raceSession?.meeting_key) return [];
    const qualiSessions = await fetchJson<any[]>(buildUrl('sessions', { meeting_key: raceSession.meeting_key, session_name: 'Qualifying' }));
    const qualiSessionKey = qualiSessions?.[0]?.session_key;
    if (!qualiSessionKey) return [];
    const url = buildUrl('results', { session_key: qualiSessionKey, order: 'position' });
    const results = await fetchJson<any[]>(url);
    return results.map((res) => {
      const driver = mapDriverFromResult(res);
      const constructorName = res.team_name ?? res.team ?? 'Unknown Team';
      return {
        position: res.position ?? res.classified_position ?? null,
        Q1: res.q1 ?? res.q1_time ?? res.best_q1_time,
        Q2: res.q2 ?? res.q2_time ?? res.best_q2_time,
        Q3: res.q3 ?? res.q3_time ?? res.best_q3_time,
        Driver: driver,
        Constructor: {
          constructorId: teamId(constructorName),
          name: constructorName,
          nationality: res.country_name ?? 'Unknown'
        }
      };
    });
  });
}

export async function getDriverStandingsFastf1(season: number) {
  const offline = loadOfflineSeason(season);
  if (offline) {
    const lastRace = offline.races[offline.races.length - 1];
    return lastRace?.Results?.map((r: any) => ({
      position: r.position ? Number(r.position) : null,
      points: r.points ? Number(r.points) : null,
      wins: r.position === '1' ? 1 : 0,
      Driver: r.Driver
    })) ?? [];
  }

  return withOfflineFallback(season, async () => {
    const url = buildUrl('standings', { year: season, order: 'position' });
    const standings = await fetchJson<any[]>(url);
    return standings.map((s) => ({
      position: s.position ?? null,
      points: s.points ?? null,
      wins: s.wins ?? null,
      Driver: mapDriverFromResult(s)
    }));
  });
}

export async function getConstructorStandingsFastf1(season: number) {
  const offline = loadOfflineSeason(season);
  if (offline) {
    const totals = new Map<string, { points: number; wins: number; name: string; nationality: string }>();
    offline.races.forEach((race) => {
      race.Results?.forEach((res: any) => {
        const key = res.Constructor.constructorId;
        const entry = totals.get(key) ?? { points: 0, wins: 0, name: res.Constructor.name, nationality: res.Constructor.nationality };
        entry.points += Number(res.points ?? 0);
        if (res.position === '1') entry.wins += 1;
        totals.set(key, entry);
      });
    });
    return Array.from(totals.entries()).map(([id, val], idx) => ({
      position: idx + 1,
      points: val.points,
      wins: val.wins,
      Constructor: { constructorId: id, name: val.name, nationality: val.nationality }
    }));
  }

  return withOfflineFallback(season, async () => {
    const url = buildUrl('standings', { year: season, class: 'team', order: 'position' });
    const standings = await fetchJson<any[]>(url);
    return standings.map((s) => ({
      position: s.position ?? null,
      points: s.points ?? null,
      wins: s.wins ?? null,
      Constructor: { constructorId: teamId(s.team_name), name: s.team_name ?? 'Unknown', nationality: s.country_name ?? 'Unknown' }
    }));
  });
}

export async function getDriversFastf1(season?: number) {
  const offline = season ? loadOfflineSeason(season) : loadOfflineSeason(2024);
  if (offline) {
    const drivers = new Map<string, any>();
    offline.races.forEach((race) => {
      race.Results?.forEach((res: any) => drivers.set(res.Driver.driverId, res.Driver));
      race.QualifyingResults?.forEach((res: any) => drivers.set(res.Driver.driverId, res.Driver));
    });
    return Array.from(drivers.values());
  }

  return withOfflineFallback(season ?? new Date().getFullYear(), async () => {
    const url = buildUrl('drivers', season ? { year: season } : {});
    const drivers = await fetchJson<any[]>(url);
    return drivers.map(mapDriverFromResult);
  });
}

export async function getConstructorsFastf1(season?: number) {
  const offline = season ? loadOfflineSeason(season) : loadOfflineSeason(2024);
  if (offline) {
    const teams = new Map<string, any>();
    offline.races.forEach((race) => {
      race.Results?.forEach((res: any) => teams.set(res.Constructor.constructorId, res.Constructor));
    });
    return Array.from(teams.values());
  }

  return withOfflineFallback(season ?? new Date().getFullYear(), async () => {
    const url = buildUrl('teams', season ? { year: season } : {});
    const teams = await fetchJson<any[]>(url);
    return teams.map((team) => ({ constructorId: teamId(team.team_name), name: team.team_name, nationality: team.country_name ?? 'Unknown' }));
  });
}

export async function getRaceFastf1(season: number, round: number) {
  const races = await getSeasonRacesFastf1(season);
  return races.find((r) => Number(r.round) === Number(round));
}

export async function getLapTimesFastf1(season: number, round: number, driverId?: string) {
  const offline = loadOfflineSeason(season);
  if (offline) return [];

  const sessionKey = await resolveRaceSession(season, round);
  if (!sessionKey) return [];
  return withOfflineFallback(season, async () => {
    const url = buildUrl('laps', { session_key: sessionKey, driver_number: driverId });
    const laps = await fetchJson<any[]>(url);
    return laps.map((lap) => ({
      number: lap.lap_number,
      Timings: [
        {
          driverId: String(lap.driver_number ?? lap.driver_id ?? ''),
          time: lap.lap_duration,
          position: lap.position ?? null
        }
      ]
    }));
  });
}
