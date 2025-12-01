import { Card } from '@/components/Card';
import { ChartPanel } from '@/components/ChartPanel';
import { LineTrend } from '@/components/charts/LineTrend';
import { SimpleTable } from '@/components/SimpleTable';
import { FunFacts } from '@/components/FunFacts';
import { positionsGained } from '@/lib/analytics';
import { funFactsFromRace } from '@/lib/funFacts';
import { getQualifyingResults, getRace, getRaceResults } from '@/lib/ergast';

export default async function RacePage({ params }: { params: { year: string; round: string } }) {
  const season = Number(params.year);
  const round = Number(params.round);
  const race = await getRace(season, round);
  const results = await getRaceResults(season, round, (race as any)?.sessionKey);
  const qualifying = await getQualifyingResults(season, round, (race as any)?.sessionKey);
  const facts = funFactsFromRace({ results: results as any[], race });

  const movers = results
    .map((r: any) => ({
      driver: r.Driver ?? r.driver,
      delta: positionsGained({ grid: r.grid, position: r.position })
    }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm uppercase tracking-wide text-slate-400">Round {round}</p>
        <h1 className="text-3xl font-bold">{race?.raceName}</h1>
        <p className="text-slate-400">{race?.Circuit?.circuitName ?? race?.circuit?.name} · {new Date(race?.date ?? '').toLocaleDateString()}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Race result">
          <SimpleTable headers={["Pos", "Driver", "Team", "Grid", "Status"]}>
            {results.map((r: any) => (
              <tr key={r.position}> 
                <td className="px-3 py-2">{r.position}</td>
                <td className="px-3 py-2">{(r.Driver ?? r.driver)?.familyName}</td>
                <td className="px-3 py-2">{(r.Constructor ?? r.constructor)?.name}</td>
                <td className="px-3 py-2">{r.grid}</td>
                <td className="px-3 py-2">{r.status}</td>
              </tr>
            ))}
          </SimpleTable>
        </Card>
        <Card title="Biggest movers">
          <SimpleTable headers={["Driver", "Δ Grid"]}>
            {movers.map((m) => (
              <tr key={m.driver.driverId}>
                <td className="px-3 py-2">{m.driver.familyName}</td>
                <td className="px-3 py-2">{m.delta}</td>
              </tr>
            ))}
          </SimpleTable>
          <FunFacts facts={facts} />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Qualifying">
          <SimpleTable headers={["Pos", "Driver", "Q1", "Q2", "Q3"]}>
            {qualifying.map((q: any) => (
              <tr key={q.position}> 
                <td className="px-3 py-2">{q.position}</td>
                <td className="px-3 py-2">{(q.Driver ?? q.driver)?.familyName}</td>
                <td className="px-3 py-2">{q.Q1}</td>
                <td className="px-3 py-2">{q.Q2}</td>
                <td className="px-3 py-2">{q.Q3}</td>
              </tr>
            ))}
          </SimpleTable>
        </Card>
        <ChartPanel title="Track evolution" description="Average session times">
          <LineTrend
            data={[{ session: 'Q1', time: averageTime(qualifying, 'Q1') }, { session: 'Q2', time: averageTime(qualifying, 'Q2') }, { session: 'Q3', time: averageTime(qualifying, 'Q3') }]}
            xKey="session"
            lines={[{ dataKey: 'time', name: 'Avg Lap (s)', color: '#22d3ee' }]}
          />
        </ChartPanel>
      </div>
    </div>
  );
}

function averageTime(results: any[], key: 'Q1' | 'Q2' | 'Q3') {
  const times = results
    .map((r) => r[key])
    .filter(Boolean)
    .map((t: string) => parseFloat(t.split(':').at(-1) ?? '0'));
  if (!times.length) return 0;
  return Number((times.reduce((a, b) => a + b, 0) / times.length).toFixed(3));
}
