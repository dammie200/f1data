import Link from 'next/link';
import { Card } from '@/components/Card';
import { getSeasonRaces, getSeasons } from '@/lib/data';
import { SeasonSelector } from '@/components/SeasonSelector';

export default async function CircuitsPage({ searchParams }: { searchParams: { season?: string } }) {
  const seasons = await getSeasons();
  const season = Number(searchParams.season ?? seasons[0]);
  const races = await getSeasonRaces(season);
  const circuits = races.map((r: any) => r.Circuit ?? r.circuit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Circuits</h1>
        <SeasonSelector seasons={seasons} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {circuits.map((c: any) => (
          <Link key={c.circuitId ?? c.id} href={`/circuits/${c.circuitId ?? c.id}?season=${season}`}>
            <Card>
              <p className="text-lg font-semibold">{c.circuitName ?? c.name}</p>
              <p className="text-sm text-slate-400">{c.Location?.locality ?? c.location}, {c.Location?.country ?? c.country}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
