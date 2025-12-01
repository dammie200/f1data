import Link from 'next/link';
import { SeasonSelector } from '@/components/SeasonSelector';
import { getConstructors, getSeasons } from '@/lib/ergast';
import { Card } from '@/components/Card';

export default async function ConstructorsPage({ searchParams }: { searchParams: { season?: string } }) {
  const seasons = await getSeasons();
  const season = Number(searchParams.season ?? seasons[0]);
  const constructors = await getConstructors(season);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Constructors</h1>
        <SeasonSelector seasons={seasons} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {constructors.map((c: any) => (
          <Link key={c.constructorId} href={`/constructors/${c.constructorId}?season=${season}`}>
            <Card>
              <p className="text-lg font-semibold">{c.name}</p>
              <p className="text-sm text-slate-400">{c.nationality}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
