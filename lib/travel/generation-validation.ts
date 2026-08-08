import type { GeneratedRecommendation, TravelRequestInput } from './types';

const daysBetweenInclusive = (a: string, b: string) => Math.floor((Date.parse(`${b}T00:00:00.000Z`) - Date.parse(`${a}T00:00:00.000Z`)) / 86_400_000) + 1;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function validateGeneratedRecommendations(request: TravelRequestInput, recs: GeneratedRecommendation[]): { ok: true } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  if (recs.length !== 3) issues.push('Generator must return exactly three recommendations.');
  recs.forEach((rec, index) => {
    const label = `Recommendation ${index + 1}`;
    if (rec.currency !== request.currency.toUpperCase()) issues.push(`${label} currency must match request.`);
    if (rec.itinerary.length !== request.tripLengthDays) issues.push(`${label} itinerary length must match request.`);
    rec.itinerary.forEach((day, dayIndex) => {
      if (day.day !== dayIndex + 1) issues.push(`${label} itinerary days must be sequential.`);
      if (day.date < request.earliestDeparture || day.date > request.latestReturn) issues.push(`${label} itinerary date must stay in window.`);
      if (day.estimatedCost < 0) issues.push(`${label} day costs must be nonnegative.`);
    });
    if (rec.startDate < request.earliestDeparture || rec.endDate > request.latestReturn || daysBetweenInclusive(rec.startDate, rec.endDate) !== request.tripLengthDays) issues.push(`${label} dates must match requested trip length and window.`);
    const components = [rec.flightEstimate, rec.accommodationEstimate, rec.foodEstimate, rec.transitEstimate, rec.experienceEstimate, rec.bufferEstimate];
    if (typeof rec.flightEstimate !== 'number' || !Number.isFinite(rec.flightEstimate)) issues.push(`${label} flight estimate is required.`);
    if (typeof rec.foodEstimate !== 'number' || !Number.isFinite(rec.foodEstimate)) issues.push(`${label} food estimate is required.`);
    if (components.some((n) => typeof n !== 'number' || !Number.isFinite(n) || n < 0)) issues.push(`${label} component costs must be nonnegative.`);
    const total = round2(components.reduce((sum, value) => sum + value, 0));
    if (Math.abs(total - rec.totalEstimatedCost) > 0.01) issues.push(`${label} total must equal component sum.`);
    if (rec.totalEstimatedCost > request.budget) issues.push(`${label} total must not exceed budget.`);
  });
  return issues.length ? { ok: false, issues } : { ok: true };
}
