export type TravelRequestInput = {
  departure: string; travelers: number; budget: number; currency: string; accommodation: string;
  tripLengthDays: number; earliestDeparture: string; latestReturn: string; flexibility: string;
  interests: string[]; pace: string;
};
export type GeneratedItineraryDay = { day: number; date: string; title: string; summary: string; estimatedCost: number; notes: string[] };
export type GeneratedRecommendation = {
  title: string; destination: string; summary: string; whyItFits: string[]; practicalNotes: string[];
  startDate: string; endDate: string; currency: string; accommodationEstimate: number; transitEstimate: number;
  experienceEstimate: number; bufferEstimate: number; totalEstimatedCost: number; itinerary: GeneratedItineraryDay[];
};
export type RecommendationGenerator = { generate(input: TravelRequestInput, correctionIssues?: string[]): Promise<GeneratedRecommendation[]> };
