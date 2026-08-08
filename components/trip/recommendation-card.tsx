import Link from 'next/link';
import type { serializeRecommendation } from '@/lib/travel/serialization';

type Rec = ReturnType<typeof serializeRecommendation>;

const formatMoney = (currency: string, value: number) => `${currency} ${value.toLocaleString()}`;

export function RecommendationCard({ rec, budget, travelers }: { rec: Rec; budget?: number; travelers?: number }) {
  const perTraveler = travelers ? Math.round(rec.totalEstimatedCost / Math.max(1, travelers)) : null;
  const overage = budget == null ? 0 : Math.max(0, rec.totalEstimatedCost - budget);
  return (
    <article className="card overflow-hidden" aria-label={rec.title}>
      <div className="gradient-destination h-28" />
      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-amber-700">Option {rec.rank}</p>
          <h2 className="text-2xl font-black">{rec.destination}</h2>
          <p className="text-stone-600">{rec.summary}</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xl font-black">{formatMoney(rec.currency, rec.totalEstimatedCost)}</p>
          {perTraveler == null ? null : <p className="text-sm text-stone-600">About {formatMoney(rec.currency, perTraveler)} per traveler</p>}
          {budget == null ? null : <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${overage > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{overage > 0 ? `${formatMoney(rec.currency, overage)} over budget` : 'Within budget'}</p>}
        </div>
        <ul className="list-disc pl-5 text-sm text-stone-600">{rec.whyItFits.map((w) => <li key={w}>{w}</li>)}</ul>
        <Link className="btn w-full" href={`/trips/${rec.id}`}>Customize budget</Link>
      </div>
    </article>
  );
}
