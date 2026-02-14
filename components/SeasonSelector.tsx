'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function SeasonSelector({ seasons, paramKey = 'season' }: { seasons: number[]; paramKey?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get(paramKey) ?? seasons[0]?.toString();

  return (
    <select
      value={current}
      onChange={(e) => {
        const value = e.target.value;
        const search = new URLSearchParams(params.toString());
        search.set(paramKey, value);
        router.push(`?${search.toString()}`);
      }}
      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
    >
      {seasons.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
