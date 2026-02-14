import { Card } from '@/components/Card';
import { SimpleTable } from '@/components/SimpleTable';
import { SeasonSelector } from '@/components/SeasonSelector';
import { getRaceResults, getSeasonRaces, getSeasons } from '@/lib/data';

export default async function CircuitPage({ params, searchParams }: { params: { circuitId: string }; searchParams: { season?: string } }) {
  const seasons = await getSeasons();
  const season = Number(searchParams.season ?? seasons[0]);
  const races = await getSeasonRaces(season);
  const race = races.find((r: any) => (r.Circuit ?? r.circuit)?.circuitId === params.circuitId);
  const results = race ? await getRaceResults(season, race.round, (race as any).sessionKey) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Circuit</p>
          <h1 className="text-3xl font-bold">{race?.Circuit?.circuitName ?? race?.circuit?.name ?? 'Unknown circuit'}</h1>
          <p className="text-slate-400">{race?.Circuit?.Location?.locality ?? race?.circuit?.location}, {race?.Circuit?.Location?.country ?? race?.circuit?.country}</p>
        </div>
        <SeasonSelector seasons={seasons} />
      </div>

      <Card title="Historical winners (season sample)">
        <SimpleTable headers={["Round", "Winner", "Constructor"]}>
          {results.slice(0, 5).map((r: any) => (
            <tr key={r.position}> 
              <td className="px-3 py-2">{race?.round}</td>
              <td className="px-3 py-2">{(r.Driver ?? r.driver)?.familyName}</td>
              <td className="px-3 py-2">{(r.Constructor ?? r.constructor)?.name}</td>
            </tr>
          ))}
        </SimpleTable>
      </Card>
    </div>
  );
}
