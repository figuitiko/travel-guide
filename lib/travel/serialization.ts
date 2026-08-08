import type { ItineraryDay, TravelRequest, TripRecommendation } from '@prisma/client';

export function dateOnly(date: Date) { return date.toISOString().slice(0, 10); }
export function serializeRequest(request: TravelRequest) {
  return { ...request, budget: Number(request.budget), earliestDeparture: dateOnly(request.earliestDeparture), latestReturn: dateOnly(request.latestReturn), createdAt: request.createdAt.toISOString(), updatedAt: request.updatedAt.toISOString() };
}
export function serializeRecommendation(rec: TripRecommendation & { itineraryDays?: ItineraryDay[] }) {
  return { ...rec, startDate: dateOnly(rec.startDate), endDate: dateOnly(rec.endDate), flightEstimate: rec.flightEstimate == null ? null : Number(rec.flightEstimate), accommodationEstimate: Number(rec.accommodationEstimate), foodEstimate: rec.foodEstimate == null ? null : Number(rec.foodEstimate), transitEstimate: Number(rec.transitEstimate), experienceEstimate: Number(rec.experienceEstimate), bufferEstimate: Number(rec.bufferEstimate), totalEstimatedCost: Number(rec.totalEstimatedCost), createdAt: rec.createdAt.toISOString(), itineraryDays: rec.itineraryDays?.map((day) => ({ ...day, date: dateOnly(day.date), estimatedCost: Number(day.estimatedCost) })) ?? [] };
}
