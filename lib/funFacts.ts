import { positionsGained } from './analytics';

export function funFactsFromRace({ results, race }: { results: any[]; race: any }) {
  if (!results?.length) return [];
  const sorted = [...results].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const winner = sorted[0];
  const biggestMover = [...results].sort((a, b) => positionsGained(b) - positionsGained(a))[0];
  const facts = [
    winner?.Driver && {
      text: `${winner.Driver.givenName} ${winner.Driver.familyName} won the ${race?.raceName ?? 'Grand Prix'} from grid ${winner.grid}.`
    },
    biggestMover?.Driver && {
      text: `${biggestMover.Driver.familyName} gained ${positionsGained(biggestMover)} spots during the race.`
    }
  ];
  return facts.filter(Boolean) as { text: string }[];
}

export function funFactsFromSeason({ standings, season }: { standings: any[]; season: number }) {
  if (!standings?.length) return [];
  const top = standings[0];
  return [
    top?.Driver && {
      text: `${top.Driver.givenName} ${top.Driver.familyName} leads the ${season} title fight with ${top.points} points.`
    },
    standings.length > 1 && {
      text: `Only ${Math.abs(Number(standings[0].points) - Number(standings[1].points)).toFixed(1)} points split the top two drivers.`
    }
  ].filter(Boolean) as { text: string }[];
}
