import type { GeneratedRecommendation, RecommendationGenerator, TravelRequestInput } from '../types';

const DAY_MS = 86_400_000;
const destinationSets = [
  ['Oaxaca City', 'Mérida', 'San Cristóbal de las Casas'],
  ['Santa Fe', 'Asheville', 'Savannah'],
  ['Lisbon', 'Québec City', 'San Juan'],
];
function profileIndex(departure: string) {
  const key = departure.toLowerCase();
  if (key.includes('mexico') || key.includes('ciudad')) return 0;
  if (key.includes('dallas')) return 1;
  return 2;
}
function addDays(date: string, days: number) { return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10); }
function makeRec(input: TravelRequestInput, destination: string, index: number): GeneratedRecommendation {
  const startDate = input.earliestDeparture;
  const endDate = addDays(startDate, input.tripLengthDays - 1);
  const budgetShare = input.budget * (0.72 + index * 0.07);
  const accommodationEstimate = Math.round(budgetShare * 0.38);
  const transitEstimate = Math.round(budgetShare * 0.24);
  const experienceEstimate = Math.round(budgetShare * 0.28);
  const bufferEstimate = Math.round((budgetShare - accommodationEstimate - transitEstimate - experienceEstimate) * 100) / 100;
  const totalEstimatedCost = Math.round((accommodationEstimate + transitEstimate + experienceEstimate + bufferEstimate) * 100) / 100;
  return {
    title: `${destination} ${['food-and-culture', 'soft-adventure', 'slow-discovery'][index]} escape`,
    destination,
    summary: `A ${input.tripLengthDays}-day ${input.pace} trip from ${input.departure} shaped around ${input.interests.slice(0, 3).join(', ')}.`,
    whyItFits: [`Fits within ${input.currency} ${input.budget.toLocaleString()}`, `Matches ${input.accommodation}`, `Balances ${input.interests[0]} with practical pacing`],
    practicalNotes: ['Prices are directional estimates, not live fares.', 'Confirm availability before booking.', `Built for ${input.travelers} traveler${input.travelers > 1 ? 's' : ''}.`],
    startDate, endDate, currency: input.currency.toUpperCase(), accommodationEstimate, transitEstimate, experienceEstimate, bufferEstimate, totalEstimatedCost,
    itinerary: Array.from({ length: input.tripLengthDays }, (_, i) => ({ day: i + 1, date: addDays(startDate, i), title: i === 0 ? `Arrive and settle into ${destination}` : `Explore ${destination} layer ${i + 1}`, summary: `A focused day with ${input.interests[i % input.interests.length]} moments, local meals, and room to breathe.`, estimatedCost: Math.round((experienceEstimate / input.tripLengthDays) * 100) / 100, notes: ['Keep plans flexible.', 'Book refundable where possible.'] })),
  };
}
export const mockGenerator: RecommendationGenerator = { async generate(input) { return destinationSets[profileIndex(input.departure)]!.map((destination, index) => makeRec(input, destination, index)); } };
