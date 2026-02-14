import Link from 'next/link';
import { SeasonSelector } from '@/components/SeasonSelector';
import { getDrivers, getSeasons } from '@/lib/data';
import { Card } from '@/components/Card';

export default async function DriversPage({ searchParams }: { searchParams: { season?: string } }) {
  const seasons = await getSeasons();
  const season = Number(searchParams.season ?? seasons[0]);
  const drivers = await getDrivers(season);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <SeasonSelector seasons={seasons} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {drivers.map((driver: any) => (
          <Link key={driver.driverId} href={`/drivers/${driver.driverId}?season=${season}`}>
            <Card>
              <p className="text-lg font-semibold">{driver.givenName} {driver.familyName}</p>
              <p className="text-sm text-slate-400">{driver.nationality}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
