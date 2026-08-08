import { GenerationStatus, Prisma } from '@prisma/client';
import { GENERATION_VERSION } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { recordEvent } from '@/lib/analytics/events';
import { createTravelRequestSchema, priceAlertSchema, travelFeedbackSchema } from './schemas';
import type { TravelRequestInput } from './types';
import { validateGeneratedRecommendations } from './generation-validation';
import { getRecommendationGenerator } from './generators';
import { assertGenerationRateLimit } from './rate-limit';

const toDate = (date: string) => new Date(`${date}T00:00:00.000Z`);
const fromRequest = (request: Awaited<ReturnType<typeof prisma.travelRequest.findUniqueOrThrow>>): TravelRequestInput => ({
  departure: request.departure, travelers: request.travelers, budget: Number(request.budget), currency: request.currency, accommodation: request.accommodation,
  tripLengthDays: request.tripLengthDays, earliestDeparture: request.earliestDeparture.toISOString().slice(0, 10), latestReturn: request.latestReturn.toISOString().slice(0, 10),
  flexibility: request.flexibility, interests: request.interests, pace: request.pace,
});

export async function createRequest(input: unknown) {
  const parsed = createTravelRequestSchema.parse(input);
  const request = await prisma.travelRequest.create({ data: { ...parsed, budget: new Prisma.Decimal(parsed.budget), earliestDeparture: toDate(parsed.earliestDeparture), latestReturn: toDate(parsed.latestReturn), generationVersion: GENERATION_VERSION } });
  await recordEvent('request_created', { requestId: request.id });
  return { requestId: request.id };
}

export async function generateRecommendations(requestId: string, identity: string, replaceExisting = false) {
  await assertGenerationRateLimit(identity, requestId);
  const claimed = await prisma.travelRequest.updateMany({ where: { id: requestId, generationStatus: replaceExisting ? GenerationStatus.COMPLETED : GenerationStatus.PENDING }, data: { generationStatus: GenerationStatus.IN_PROGRESS, sanitizedError: null } });
  if (claimed.count !== 1) {
    const existing = await prisma.tripRecommendation.findMany({ where: { requestId }, select: { id: true }, orderBy: { rank: 'asc' } });
    if (existing.length) return { recommendationIds: existing.map((r) => r.id) };
    throw new Error('GENERATION_ALREADY_RUNNING');
  }
  const request = await prisma.travelRequest.findUniqueOrThrow({ where: { id: requestId } });
  const generator = getRecommendationGenerator();
  const input = fromRequest(request);
  let generated = await generator.generate(input);
  let validation = validateGeneratedRecommendations(input, generated);
  if (!validation.ok) {
    generated = await generator.generate(input, validation.issues);
    validation = validateGeneratedRecommendations(input, generated);
  }
  if (!validation.ok) {
    await prisma.travelRequest.update({ where: { id: requestId }, data: { generationStatus: GenerationStatus.FAILED, sanitizedError: 'Trip generation failed validation. Please retry.' } });
    await recordEvent('generation_failed', { requestId });
    throw new Error('GENERATION_VALIDATION_FAILED');
  }
  const result = await prisma.$transaction(async (tx) => {
    if (replaceExisting) await tx.tripRecommendation.deleteMany({ where: { requestId } });
    const ids: string[] = [];
    for (const [index, rec] of generated.entries()) {
      const saved = await tx.tripRecommendation.create({ data: { requestId, rank: index + 1, title: rec.title, destination: rec.destination, summary: rec.summary, whyItFits: rec.whyItFits, practicalNotes: rec.practicalNotes, startDate: toDate(rec.startDate), endDate: toDate(rec.endDate), currency: rec.currency, flightEstimate: rec.flightEstimate, accommodationEstimate: rec.accommodationEstimate, foodEstimate: rec.foodEstimate, transitEstimate: rec.transitEstimate, experienceEstimate: rec.experienceEstimate, bufferEstimate: rec.bufferEstimate, totalEstimatedCost: rec.totalEstimatedCost, itineraryDays: { create: rec.itinerary.map((day) => ({ day: day.day, date: toDate(day.date), title: day.title, summary: day.summary, estimatedCost: day.estimatedCost, notes: day.notes })) } } });
      ids.push(saved.id);
    }
    await tx.travelRequest.update({ where: { id: requestId }, data: { generationStatus: GenerationStatus.COMPLETED } });
    return ids;
  });
  await recordEvent('recommendations_generated', { requestId, count: result.length });
  return { recommendationIds: result };
}

export async function createAlert(input: unknown) {
  const parsed = priceAlertSchema.parse(input);
  try {
    await prisma.priceAlert.create({ data: { recommendationId: parsed.recommendationId, email: parsed.email, normalizedEmail: parsed.email } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { message: "You're already watching this trip. We'll keep it on your shortlist." };
    throw error;
  }
  await recordEvent('alert_created', { recommendationId: parsed.recommendationId });
  return { message: "You're on the list — we'll let you know when this estimate changes." };
}

export async function submitFeedback(input: unknown) {
  const parsed = travelFeedbackSchema.parse(input);
  const feedback = await prisma.travelFeedback.create({ data: { requestId: parsed.requestId, recommendationId: parsed.recommendationId, rating: parsed.rating, comment: parsed.comment || null } });
  await recordEvent('feedback_submitted', { rating: parsed.rating, requestId: parsed.requestId ?? null, recommendationId: parsed.recommendationId ?? null });
  return { feedbackId: feedback.id };
}
