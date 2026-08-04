import { describe, expect, it } from 'vitest';
import { mockGenerator } from '@/lib/travel/generators/mock';
import { validateGeneratedRecommendations } from '@/lib/travel/generation-validation';
import type { TravelRequestInput } from '@/lib/travel/types';

const request: TravelRequestInput = {
  departure: 'Mexico City', travelers: 2, budget: 3000, currency: 'USD', accommodation: 'boutique hotel',
  tripLengthDays: 4, earliestDeparture: '2026-10-01', latestReturn: '2026-10-20', flexibility: 'Flexible',
  interests: ['food', 'culture'], pace: 'balanced',
};

describe('mock generator', () => {
  it('returns deterministic exactly three recommendations with requested itinerary length', async () => {
    const first = await mockGenerator.generate(request);
    const second = await mockGenerator.generate(request);
    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first.every((rec) => rec.itinerary.length === 4)).toBe(true);
  });
});

describe('generated recommendation validation', () => {
  it('accepts valid generated recommendations', async () => {
    const generated = await mockGenerator.generate(request);
    const result = validateGeneratedRecommendations(request, generated);
    expect(result.ok).toBe(true);
  });

  it('rejects totals over budget and invalid day sequencing', async () => {
    const generated = await mockGenerator.generate(request);
    generated[0]!.totalEstimatedCost = 9999;
    generated[0]!.itinerary[1]!.day = 7;
    const result = validateGeneratedRecommendations(request, generated);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.join(' ')).toMatch(/budget/i);
      expect(result.issues.join(' ')).toMatch(/sequential/i);
    } else throw new Error('expected invalid recommendations');
  });
});
