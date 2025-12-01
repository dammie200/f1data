import { Lightbulb } from './icons';

export interface FunFact {
  text: string;
  context?: string;
}

export function FunFacts({ facts }: { facts: FunFact[] }) {
  if (!facts.length) return null;
  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-amber-300">
        <Lightbulb className="h-5 w-5" />
        <span className="text-sm font-semibold uppercase tracking-wide">Did you know?</span>
      </div>
      <ul className="space-y-1 text-sm text-amber-100">
        {facts.map((fact, idx) => (
          <li key={idx} className="leading-relaxed">
            • {fact.text}
            {fact.context && <span className="text-amber-200/80"> ({fact.context})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
