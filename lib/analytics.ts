import { Result } from '@prisma/client';

export function computeConsistency(laps: { milliseconds?: number | null }[]) {
  const filtered = laps
    .map((l) => l.milliseconds)
    .filter((ms): ms is number => typeof ms === 'number')
    .filter((ms, _, arr) => {
      const median = arr.sort((a, b) => a - b)[Math.floor(arr.length / 2)] ?? 0;
      return Math.abs(ms - median) < 10000; // discard very slow laps (SC or pit)
    });
  if (!filtered.length) return { average: 0, deviation: 0, score: 0 };
  const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  const variance = filtered.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / filtered.length;
  const deviation = Math.sqrt(variance);
  const score = Math.max(0, 100 - deviation / 10);
  return { average: avg, deviation, score };
}

export function positionsGained(result: { grid?: number | null; position?: number | null }) {
  if (!result.grid || !result.position) return 0;
  return result.grid - result.position;
}

export function lapOneDelta(results: Result[]) {
  return results.map((r) => ({
    driverId: r.driverId,
    delta: positionsGained({ grid: r.grid, position: r.position })
  }));
}

export function qualifyingVsRace(results: { driver: any; grid?: number | null; position?: number | null }[]) {
  const grouped: Record<string, { driver: any; races: number; avgQual: number; avgRace: number }> = {};
  results.forEach((r) => {
    if (!grouped[r.driver.driverId]) grouped[r.driver.driverId] = { driver: r.driver, races: 0, avgQual: 0, avgRace: 0 };
    const entry = grouped[r.driver.driverId];
    entry.races += 1;
    entry.avgQual += r.grid ?? entry.grid ?? 0;
    entry.avgRace += r.position ?? entry.position ?? 0;
  });
  return Object.values(grouped).map((g) => ({
    driver: g.driver,
    avgQual: g.avgQual / g.races,
    avgRace: g.avgRace / g.races,
    qualRaceDelta: g.avgQual / g.races - g.avgRace / g.races
  }));
}
