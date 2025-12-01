import { Card } from '@/components/Card';
import { FunFacts } from '@/components/FunFacts';
import { SeasonSelector } from '@/components/SeasonSelector';
import { ChartPanel } from '@/components/ChartPanel';
import { LineTrend } from '@/components/charts/LineTrend';
import { SimpleTable } from '@/components/SimpleTable';
import { funFactsFromSeason } from '@/lib/funFacts';
import { getConstructorStandings, getDriverStandings, getSeasonRaces, getSeasons } from '@/lib/data';

function normalizeDriverStanding(standing: any) {
  if ('driverId' in standing) {
    return {
      position: standing.position,
      points: standing.points,
      wins: standing.wins,
      driver: standing.driver
    };
  }
  return {
    position: Number(standing.position),
    points: Number(standing.points),
    wins: Number(standing.wins),
    driver: standing.Driver
  };
}

function normalizeConstructorStanding(standing: any) {
  if ('constructorId' in standing) {
    return {
      position: standing.position,
      points: standing.points,
      wins: standing.wins,
      constructor: standing.constructor
    };
  }
  return {
    position: Number(standing.position),
    points: Number(standing.points),
    wins: Number(standing.wins),
    constructor: standing.Constructor
  };
}

export default async function Home({ searchParams }: { searchParams: { season?: string } }) {
  const seasons = await getSeasons();
  const selectedSeason = Number(searchParams?.season ?? seasons[0]);
  const driverStandingsRaw = await getDriverStandings(selectedSeason);
  const constructorStandingsRaw = await getConstructorStandings(selectedSeason);
  const races = await getSeasonRaces(selectedSeason);

  const driverStandings = driverStandingsRaw.map(normalizeDriverStanding).slice(0, 10);
  const constructorStandings = constructorStandingsRaw.map(normalizeConstructorStanding).slice(0, 10);

  const upcoming = races.find((r: any) => new Date(r.date) > new Date());
  const last = races
    .filter((r: any) => new Date(r.date) <= new Date())
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const facts = funFactsFromSeason({ standings: driverStandingsRaw as any[], season: selectedSeason });

  const championshipTrend = driverStandings.map((s) => ({ name: s.driver.familyName ?? s.driver.familyName ?? 'Driver', points: s.points }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Season dashboard</p>
          <h1 className="text-3xl font-bold text-white">{selectedSeason} insights</h1>
        </div>
        <SeasonSelector seasons={seasons} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Drivers Standings (Top 10)">
          <SimpleTable headers={["Pos", "Driver", "Pts", "Wins"]}>
            {driverStandings.map((s) => (
              <tr key={s.driver.driverId}>
                <td className="px-3 py-2">{s.position}</td>
                <td className="px-3 py-2">{s.driver.givenName} {s.driver.familyName}</td>
                <td className="px-3 py-2">{s.points}</td>
                <td className="px-3 py-2">{s.wins}</td>
              </tr>
            ))}
          </SimpleTable>
        </Card>
        <Card title="Constructors Standings (Top 10)">
          <SimpleTable headers={["Pos", "Team", "Pts", "Wins"]}>
            {constructorStandings.map((s) => (
              <tr key={s.constructor.constructorId}>
                <td className="px-3 py-2">{s.position}</td>
                <td className="px-3 py-2">{s.constructor.name}</td>
                <td className="px-3 py-2">{s.points}</td>
                <td className="px-3 py-2">{s.wins}</td>
              </tr>
            ))}
          </SimpleTable>
        </Card>
        <Card title={upcoming ? 'Upcoming Grand Prix' : 'Last Grand Prix'} accent>
          {upcoming ? (
            <div>
              <p className="text-lg font-semibold">{upcoming.raceName}</p>
              <p className="text-sm text-slate-300">{upcoming.Circuit?.circuitName ?? upcoming.Circuit?.name}</p>
              <p className="mt-2 text-sm text-amber-200">{new Date(upcoming.date).toLocaleDateString()}</p>
            </div>
          ) : last ? (
            <div>
              <p className="text-lg font-semibold">{last.raceName}</p>
              <p className="text-sm text-slate-300">{last.Circuit?.circuitName ?? last.Circuit?.name}</p>
              <p className="mt-2 text-sm text-amber-200">{new Date(last.date).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No race data available.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartPanel title="Points Leaders" description="How the top ten stack up right now.">
          <LineTrend data={championshipTrend} lines={[{ dataKey: 'points', name: 'Points', color: '#f21d2f' }]} xKey="name" />
        </ChartPanel>
        <Card title="Season context">
          <p className="text-sm text-slate-300">
            Ergast data cached locally keeps the app blazing fast. Dive into races, drivers, constructors, and circuits to see pace
            profiles, positions gained, and strategic calls.
          </p>
          <FunFacts facts={facts} />
        </Card>
      </div>

      <Card title="Races this season">
        <SimpleTable headers={["Round", "Race", "Date", "Circuit"]}>
          {races.map((race: any) => (
            <tr key={race.round}>
              <td className="px-3 py-2">{race.round}</td>
              <td className="px-3 py-2">{race.raceName}</td>
              <td className="px-3 py-2">{new Date(race.date).toLocaleDateString()}</td>
              <td className="px-3 py-2">{race.Circuit?.circuitName ?? race.Circuit?.name ?? race.circuit?.name}</td>
            </tr>
          ))}
        </SimpleTable>
      </Card>
    </div>
  );
}
