import { Card } from '@/components/Card';
import { ChartPanel } from '@/components/ChartPanel';
import { LineTrend } from '@/components/charts/LineTrend';
import { SimpleTable } from '@/components/SimpleTable';
import { SeasonSelector } from '@/components/SeasonSelector';
import { getConstructorStandings, getConstructors, getRaceResults, getSeasonRaces, getSeasons } from '@/lib/data';

export default async function ConstructorPage({ params, searchParams }: { params: { constructorId: string }; searchParams: { season?: string } }) {
  const seasons = await getSeasons();
  const season = Number(searchParams.season ?? seasons[0]);
  const races = await getSeasonRaces(season);
  const resultsPerRace = await Promise.all(races.map((race: any) => getRaceResults(season, race.round, race.sessionKey)));
  const teamResults = resultsPerRace.flat().filter((r: any) => (r.Constructor ?? r.constructor)?.constructorId === params.constructorId);
  const standings = await getConstructorStandings(season);
  const teamStanding = (standings as any[]).find((s) => (s.Constructor ?? s.constructor)?.constructorId === params.constructorId);

  const points = teamResults.reduce((sum, r: any) => sum + Number(r.points ?? 0), 0);
  const wins = teamResults.filter((r: any) => Number(r.position) === 1).length;
  const podiums = teamResults.filter((r: any) => Number(r.position) <= 3).length;

  const roundPoints = races.map((race: any) => {
    const res = teamResults.filter((r: any) => Number(r.race?.round ?? r.round) === Number(race.round));
    return { round: race.round, points: res.reduce((s, r) => s + Number(r.points ?? 0), 0) };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Constructor</p>
          <h1 className="text-3xl font-bold">{teamResults[0]?.Constructor?.name ?? teamResults[0]?.constructor?.name ?? params.constructorId}</h1>
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
        <Card title="Standing">
          <p className="text-3xl font-bold">{teamStanding?.position ?? '–'}</p>
        </Card>
      </div>

      <ChartPanel title="Points contribution by round" description="Summed across both cars.">
        <LineTrend data={roundPoints} xKey="round" lines={[{ dataKey: 'points', name: 'Points', color: '#facc15' }]} />
      </ChartPanel>

      <Card title="Results">
        <SimpleTable headers={["Round", "Driver", "Pos", "Pts"]}>
          {teamResults.map((r: any) => (
            <tr key={`${r.Driver?.driverId ?? r.driver?.driverId}-${r.race?.round ?? r.round}`}>
              <td className="px-3 py-2">{r.race?.round ?? r.round}</td>
              <td className="px-3 py-2">{(r.Driver ?? r.driver)?.familyName}</td>
              <td className="px-3 py-2">{r.position}</td>
              <td className="px-3 py-2">{r.points}</td>
            </tr>
          ))}
        </SimpleTable>
      </Card>
    </div>
  );
}
