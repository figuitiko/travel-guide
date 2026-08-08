import OpenAI from 'openai';
import { GENERATION_VERSION } from '@/lib/constants';
import type { GeneratedRecommendation, RecommendationGenerator, TravelRequestInput } from '../types';

const schema = {
  type: 'object', additionalProperties: false, required: ['recommendations'],
  properties: { recommendations: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', additionalProperties: false, required: ['title','destination','summary','whyItFits','practicalNotes','startDate','endDate','currency','flightEstimate','accommodationEstimate','foodEstimate','transitEstimate','experienceEstimate','bufferEstimate','totalEstimatedCost','itinerary'], properties: {
    title: { type: 'string' }, destination: { type: 'string' }, summary: { type: 'string' }, whyItFits: { type: 'array', items: { type: 'string' } }, practicalNotes: { type: 'array', items: { type: 'string' } }, startDate: { type: 'string' }, endDate: { type: 'string' }, currency: { type: 'string' }, flightEstimate: { type: 'number' }, accommodationEstimate: { type: 'number' }, foodEstimate: { type: 'number' }, transitEstimate: { type: 'number' }, experienceEstimate: { type: 'number' }, bufferEstimate: { type: 'number' }, totalEstimatedCost: { type: 'number' }, itinerary: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['day','date','title','summary','estimatedCost','notes'], properties: { day: { type: 'integer' }, date: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string' }, estimatedCost: { type: 'number' }, notes: { type: 'array', items: { type: 'string' } } } } }
  } } } },
} as const;

export const openAiGenerator: RecommendationGenerator = {
  async generate(input: TravelRequestInput, correctionIssues = []) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: 'gpt-5.6-terra',
      reasoning: { effort: 'low' },
      instructions: `You are TripPossible ${GENERATION_VERSION}. Return realistic inspiration only, not booking, visa, live-price, or availability claims. Output exactly three diverse budget-valid trip recommendations.`,
      input: JSON.stringify({ request: input, correctionIssues }),
      text: { verbosity: 'low', format: { type: 'json_schema', name: 'trippossible_recommendations', strict: true, schema } },
    });
    const text = response.output_text;
    const parsed = JSON.parse(text) as { recommendations: GeneratedRecommendation[] };
    return parsed.recommendations;
  },
};
