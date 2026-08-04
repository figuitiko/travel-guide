import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertForm, FeedbackForm } from '@/components/trip/alert-feedback-forms';
import { prisma } from '@/lib/db';
import { recordEvent } from '@/lib/analytics/events';
import { ESTIMATE_DISCLAIMER } from '@/lib/constants';
import { serializeRecommendation } from '@/lib/travel/serialization';
export const dynamic = 'force-dynamic';
export default async function TripPage({ params }: { params: Promise<{ recommendationId: string }> }) {
  const { recommendationId } = await params;
  const recRaw = await prisma.tripRecommendation.findUnique({ where: { id: recommendationId }, include: { itineraryDays: { orderBy: { day: 'asc' } }, request: true } });
  if (!recRaw) notFound();
  await recordEvent('recommendation_opened', { recommendationId });
  const rec = serializeRecommendation(recRaw);
  return <div className="mx-auto max-w-5xl px-5 py-10"><Link className="text-sm font-semibold text-amber-800" href={`/plan/results/${recRaw.requestId}`}>← Back to results</Link><section className="card mt-5 overflow-hidden"><div className="gradient-destination p-8 text-white"><p className="uppercase tracking-widest">{rec.destination}</p><h1 className="mt-3 text-4xl font-black">{rec.title}</h1><p className="mt-3 max-w-2xl text-white/85">{rec.summary}</p></div><div className="grid gap-6 p-6 md:grid-cols-[1fr_280px]"><div><h2 className="text-2xl font-black">Day-by-day itinerary</h2><ol className="mt-4 space-y-4">{rec.itineraryDays.map((day) => <li className="rounded-2xl bg-white p-4" key={day.id}><p className="font-bold">Day {day.day} · {day.date}</p><h3 className="text-lg font-black">{day.title}</h3><p className="text-stone-600">{day.summary}</p></li>)}</ol></div><aside className="space-y-4"><div className="rounded-2xl bg-white p-4"><h2 className="font-black">Cost estimate</h2>{[['Stay', rec.accommodationEstimate], ['Transit', rec.transitEstimate], ['Experiences', rec.experienceEstimate], ['Buffer', rec.bufferEstimate]].map(([k,v]) => <p className="flex justify-between" key={String(k)}><span>{String(k)}</span><strong>{rec.currency} {Number(v).toLocaleString()}</strong></p>)}<p className="mt-3 flex justify-between border-t pt-3 text-lg"><span>Total</span><strong>{rec.currency} {rec.totalEstimatedCost.toLocaleString()}</strong></p></div><div className="rounded-2xl bg-white p-4"><h2 className="font-black">Practical notes</h2><ul className="mt-2 list-disc pl-5 text-sm text-stone-600">{rec.practicalNotes.map((note) => <li key={note}>{note}</li>)}</ul></div></aside></div></section><div className="mt-6 grid gap-5 md:grid-cols-2"><AlertForm recommendationId={recommendationId} /><FeedbackForm recommendationId={recommendationId} /></div><p className="mt-6 text-sm text-stone-600">{ESTIMATE_DISCLAIMER}</p></div>;
}
