import { Card } from '@/components/Card';
import { ChartPanel } from '@/components/ChartPanel';
import { LineTrend } from '@/components/charts/LineTrend';
import { SimpleTable } from '@/components/SimpleTable';
import { SeasonSelector } from '@/components/SeasonSelector';
import { positionsGained, qualifyingVsRace } from '@/lib/analytics';
import { getQualifyingResults, getRaceResults, getSeasonRaces, getSeasons } from '@/lib/ergast';

export default async function DriverPage({ params, searchParams }: { params: { driverId: string }; searchParams: { season?: string } }) {
  const seasons = await getSeasons();
  const season = Number(searchParams.season ?? seasons[0]);
  const races = await getSeasonRaces(season);
  const resultsPerRace = await Promise.all(races.map((race: any) => getRaceResults(season, race.round)));
  const qualiPerRace = await Promise.all(races.map((race: any) => getQualifyingResults(season, race.round)));

  const driverResults = resultsPerRace.flat().filter((r: any) => (r.Driver ?? r.driver)?.driverId === params.driverId);
  const driverQuali = qualiPerRace.flat().filter((q: any) => (q.Driver ?? q.driver)?.driverId === params.driverId);

  const points = driverResults.reduce((sum, r: any) => sum + Number(r.points ?? 0), 0);
  const wins = driverResults.filter((r: any) => Number(r.position) === 1).length;
  const podiums = driverResults.filter((r: any) => Number(r.position) <= 3).length;
  const dnfs = driverResults.filter((r: any) => (r.status ?? '').toLowerCase().includes('ret')).length;

  const positionChart = driverResults.map((r: any) => ({ round: r.race?.round ?? r.round ?? 'R', finish: Number(r.position) }))
    .sort((a, b) => Number(a.round) - Number(b.round));

  const qualRaceDelta = qualifyingVsRace(driverResults as any[]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Driver</p>
          <h1 className="text-3xl font-bold">{driverResults[0]?.Driver?.givenName ?? driverResults[0]?.driver?.givenName} {driverResults[0]?.Driver?.familyName ?? driverResults[0]?.driver?.familyName}</h1>
          <p className="text-slate-400">Season {season}</p>
        </div>
        <SeasonSelector seasons={seasons} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Points" accent>
          <p className="text-3xl font-bold">{points}</p>
        </Card>
        <Card title="Wins">
          <p className="text-3xl font-bold">{wins}</p>
        </Card>
        <Card title="Podiums">
          <p className="text-3xl font-bold">{podiums}</p>
        </Card>
        <Card title="DNFs">
          <p className="text-3xl font-bold text-amber-400">{dnfs}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartPanel title="Finishing positions" description="Lower is better">
          <LineTrend data={positionChart} xKey="round" lines={[{ dataKey: 'finish', name: 'Finish', color: '#22d3ee' }]} />
        </ChartPanel>
        <Card title="Qualifying vs race delta">
          <SimpleTable headers={["Round", "Grid", "Finish", "Delta"]}>
            {driverResults.map((r: any) => (
              <tr key={`${r.race?.round ?? r.round}`}> 
                <td className="px-3 py-2">{r.race?.round ?? r.round}</td>
                <td className="px-3 py-2">{r.grid}</td>
                <td className="px-3 py-2">{r.position}</td>
                <td className="px-3 py-2">{positionsGained({ grid: r.grid, position: r.position })}</td>
              </tr>
            ))}
          </SimpleTable>
        </Card>
      </div>

      <Card title="Head-to-head vs field">
        <SimpleTable headers={["Metric", "Value"]}>
          {qualRaceDelta.map((entry) => (
            <tr key={entry.driver.driverId}>
              <td className="px-3 py-2">Qual - Race delta</td>
              <td className="px-3 py-2">{entry.qualRaceDelta.toFixed(2)} (positive = Sunday specialist)</td>
            </tr>
          ))}
        </SimpleTable>
      </Card>
    </div>
  );
}
