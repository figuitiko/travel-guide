import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { GENERATION_VERSION } from '../lib/constants';
import { mockGenerator } from '../lib/travel/generators/mock';
import type { TravelRequestInput } from '../lib/travel/types';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
const scenarios: TravelRequestInput[] = [
  { departure: 'Mexico City', travelers: 2, budget: 3000, currency: 'USD', accommodation: 'boutique hotel', tripLengthDays: 4, earliestDeparture: '2026-10-01', latestReturn: '2026-10-20', flexibility: 'Flexible', interests: ['food', 'culture'], pace: 'balanced' },
  { departure: 'Dallas', travelers: 3, budget: 4200, currency: 'USD', accommodation: 'family-friendly hotel', tripLengthDays: 5, earliestDeparture: '2026-11-05', latestReturn: '2026-11-20', flexibility: 'Weekend preferred', interests: ['nature', 'history'], pace: 'relaxed' },
];
const toDate = (d: string) => new Date(`${d}T00:00:00.000Z`);
for (const input of scenarios) {
  const request = await prisma.travelRequest.create({ data: { ...input, budget: new Prisma.Decimal(input.budget), earliestDeparture: toDate(input.earliestDeparture), latestReturn: toDate(input.latestReturn), generationVersion: GENERATION_VERSION, generationStatus: 'COMPLETED' } });
  const recs = await mockGenerator.generate(input);
  for (const [index, rec] of recs.entries()) {
    await prisma.tripRecommendation.create({ data: { requestId: request.id, rank: index + 1, title: rec.title, destination: rec.destination, summary: rec.summary, whyItFits: rec.whyItFits, practicalNotes: rec.practicalNotes, startDate: toDate(rec.startDate), endDate: toDate(rec.endDate), currency: rec.currency, flightEstimate: rec.flightEstimate, accommodationEstimate: rec.accommodationEstimate, foodEstimate: rec.foodEstimate, transitEstimate: rec.transitEstimate, experienceEstimate: rec.experienceEstimate, bufferEstimate: rec.bufferEstimate, totalEstimatedCost: rec.totalEstimatedCost, itineraryDays: { create: rec.itinerary.map((day) => ({ day: day.day, date: toDate(day.date), title: day.title, summary: day.summary, estimatedCost: day.estimatedCost, notes: day.notes })) } } });
  }
}
await prisma.$disconnect();
