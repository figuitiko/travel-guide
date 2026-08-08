import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ESTIMATE_DISCLAIMER } from '@/lib/constants';
import { serializeRecommendation, serializeRequest } from '@/lib/travel/serialization';
import { RecommendationCard } from '@/components/trip/recommendation-card';
import { RegenerateButton } from '@/components/trip/regenerate-button';
export const dynamic = 'force-dynamic';
export default async function ResultsPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const request = await prisma.travelRequest.findUnique({ where: { id: requestId }, include: { recommendations: { orderBy: { rank: 'asc' } } } });
  if (!request) notFound();
  const req = serializeRequest(request);
  const recs = request.recommendations.map((r) => serializeRecommendation(r));
  return <div className="mx-auto max-w-6xl px-5 py-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-amber-700">Your three possibilities</p><h1 className="text-4xl font-black">Trips from {req.departure}</h1><p className="mt-2 text-stone-600">{req.travelers} travelers · {req.currency} {req.budget.toLocaleString()} · {req.tripLengthDays} days · {req.interests.join(', ')}</p></div><RegenerateButton requestId={requestId} /></div>{request.generationStatus === 'FAILED' && <div className="card mt-6 p-5 text-red-700">Generation failed. Your request is saved; use regenerate to retry.</div>}{recs.length === 0 ? <div className="card mt-8 p-8">No recommendations yet. Retry generation from the planner.</div> : <section className="mt-8 grid gap-5 md:grid-cols-3">{recs.map((rec) => <RecommendationCard rec={rec} key={rec.id} budget={req.budget} travelers={req.travelers} />)}</section>}<p className="mt-6 text-sm text-stone-600">{ESTIMATE_DISCLAIMER}</p></div>;
}
