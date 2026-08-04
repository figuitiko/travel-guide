import { useMockAi } from '@/lib/env';
import type { RecommendationGenerator } from '../types';
import { mockGenerator } from './mock';
import { openAiGenerator } from './openai';

export function getRecommendationGenerator(): RecommendationGenerator {
  if (useMockAi) return mockGenerator;
  if (!process.env.OPENAI_API_KEY) throw new Error('AI provider is not configured.');
  return openAiGenerator;
}
