import { Card } from '@/components/Card';
import { ChartPanel } from '@/components/ChartPanel';
import { LineTrend } from '@/components/charts/LineTrend';
import { BarCompare } from '@/components/charts/BarCompare';
import { SimpleTable } from '@/components/SimpleTable';
import { funFactsFromSeason } from '@/lib/funFacts';
import { getDriverStandings, getQualifyingResults, getRaceResults, getSeasonRaces } from '@/lib/ergast';
import { FunFacts } from '@/components/FunFacts';

function toMillis(time?: string | null) {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length === 2) {
    const [m, s] = parts;
    return Number(m) * 60 * 1000 + Number(s.replace(/\./, ''));
  }
  return Number(time.replace(/\./, ''));
}

export default async function SeasonPage({ params }: { params: { year: string } }) {
  const season = Number(params.year);
  const races = await getSeasonRaces(season);
  const standings = await getDriverStandings(season);
  const facts = funFactsFromSeason({ standings: standings as any[], season });

  // Championship trend by accumulating points for top 5 drivers
  const topDrivers = (standings as any[]).slice(0, 5).map((s) => s.Driver ?? s.driver);
  const trend: any[] = [];
  const driverPoints: Record<string, number> = {};

  for (const race of races) {
    const results = await getRaceResults(season, race.round);
    results.forEach((res: any) => {
      const driver = res.Driver ?? res.driver;
      const key = driver.driverId;
      if (!(key in driverPoints)) driverPoints[key] = 0;
      driverPoints[key] += Number(res.points ?? res.points ?? 0);
    });
    const entry: any = { round: race.round };
    topDrivers.forEach((d) => {
      entry[d.driverId] = driverPoints[d.driverId] ?? 0;
    });
    trend.push(entry);
  }

  // Competitiveness index: avg gap between P1 and P10 in qualifying
  const qualiGaps: { round: number; gap: number }[] = [];
  for (const race of races) {
    const quali = await getQualifyingResults(season, race.round);
    const sorted = [...quali].sort((a: any, b: any) => Number(a.position ?? 99) - Number(b.position ?? 99));
    const p1 = toMillis(sorted[0]?.Q3 ?? sorted[0]?.Q2 ?? sorted[0]?.Q1);
    const p10 = toMillis(sorted[9]?.Q3 ?? sorted[9]?.Q2 ?? sorted[9]?.Q1);
    if (p1 && p10) {
      qualiGaps.push({ round: Number(race.round), gap: (p10 - p1) / 1000 });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Season {season}</h1>
        <p className="text-sm text-slate-400">{races.length} rounds</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartPanel title="Title battle" description="Driver points after each round (top 5).">
          <LineTrend
            data={trend}
            xKey="round"
            lines={topDrivers.map((d, idx) => ({ dataKey: d.driverId, name: d.familyName ?? d.name ?? `Driver ${idx + 1}` }))}
          />
        </ChartPanel>
        <ChartPanel title="Competitiveness" description="Avg qualifying gap P1 → P10 in seconds.">
          <BarCompare data={qualiGaps} xKey="round" barKey="gap" color="#f97316" />
        </ChartPanel>
      </div>

      <Card title="Races">
        <SimpleTable headers={["Round", "Grand Prix", "Date", "Winner"]}>
          {races.map((race: any) => (
            <tr key={race.round}>
              <td className="px-3 py-2">{race.round}</td>
              <td className="px-3 py-2">{race.raceName}</td>
              <td className="px-3 py-2">{new Date(race.date).toLocaleDateString()}</td>
              <td className="px-3 py-2">TBD</td>
            </tr>
          ))}
        </SimpleTable>
      </Card>

      <FunFacts facts={facts} />
    </div>
  );
}
