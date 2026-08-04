import { describe, expect, it } from 'vitest';
import { createTravelRequestSchema, priceAlertSchema, travelFeedbackSchema } from '@/lib/travel/schemas';

const base = {
  departure: 'Mexico City',
  travelers: 2,
  budget: 2800,
  currency: 'USD',
  accommodation: 'boutique hotel',
  tripLengthDays: 5,
  earliestDeparture: '2026-10-01',
  latestReturn: '2026-10-10',
  flexibility: 'Flexible by a few days',
  interests: ['food', 'culture'],
  pace: 'balanced',
};

describe('travel request schema', () => {
  it('normalizes valid inputs to bounded UTC date-only strings', () => {
    const parsed = createTravelRequestSchema.parse({ ...base, currency: 'usd', departure: '  Mexico City  ' });
    expect(parsed.currency).toBe('USD');
    expect(parsed.departure).toBe('Mexico City');
    expect(parsed.earliestDeparture).toBe('2026-10-01');
  });

  it('rejects windows that cannot fit trip length', () => {
    const result = createTravelRequestSchema.safeParse({ ...base, tripLengthDays: 10, earliestDeparture: '2026-10-01', latestReturn: '2026-10-05' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.latestReturn?.[0]).toMatch(/accommodate/i);
  });

  it('rejects unrecognized interests and out of range numbers', () => {
    const result = createTravelRequestSchema.safeParse({ ...base, travelers: 11, budget: 1_000_001, interests: ['space'] });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.travelers).toBeDefined();
    expect(result.error?.flatten().fieldErrors.budget).toBeDefined();
    expect(result.error?.flatten().fieldErrors.interests).toBeDefined();
  });
});

describe('alert and feedback schemas', () => {
  it('normalizes alert emails', () => {
    const parsed = priceAlertSchema.parse({ recommendationId: 'clx1234567890', email: '  FRANK@EXAMPLE.COM ' });
    expect(parsed.email).toBe('frank@example.com');
  });

  it('requires exactly one feedback target', () => {
    expect(travelFeedbackSchema.safeParse({ requestId: 'a', recommendationId: 'b', rating: 4 }).success).toBe(false);
    expect(travelFeedbackSchema.safeParse({ rating: 4 }).success).toBe(false);
    expect(travelFeedbackSchema.safeParse({ recommendationId: 'b', rating: 5, comment: 'Great' }).success).toBe(true);
  });
});
