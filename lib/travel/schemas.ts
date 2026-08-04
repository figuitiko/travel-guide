import { z } from 'zod';
import { INTERESTS, SUPPORTED_CURRENCIES } from '@/lib/constants';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').transform((v) => new Date(`${v}T00:00:00.000Z`).toISOString().slice(0, 10));
const trim = (min: number, max: number) => z.string().trim().min(min).max(max);
const interestEnum = z.enum(INTERESTS);

export const createTravelRequestSchema = z.object({
  departure: trim(2, 120),
  travelers: z.coerce.number().int().min(1).max(10),
  budget: z.coerce.number().positive().max(1_000_000),
  currency: z.string().trim().toUpperCase().length(3).refine((v) => SUPPORTED_CURRENCIES.includes(v as never), 'Choose a supported currency'),
  accommodation: trim(2, 80),
  tripLengthDays: z.coerce.number().int().min(2).max(30),
  earliestDeparture: dateOnly,
  latestReturn: dateOnly,
  flexibility: trim(2, 120),
  interests: z.array(interestEnum).min(1).max(6),
  pace: trim(2, 40),
}).superRefine((value, ctx) => {
  const start = Date.parse(`${value.earliestDeparture}T00:00:00.000Z`);
  const end = Date.parse(`${value.latestReturn}T00:00:00.000Z`);
  const availableDays = Math.floor((end - start) / 86_400_000) + 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || availableDays < value.tripLengthDays) {
    ctx.addIssue({ code: 'custom', path: ['latestReturn'], message: 'Date window must accommodate the full trip length.' });
  }
});

export const generateSchema = z.object({ requestId: z.string().min(1).max(80) });
export const recommendationIdSchema = z.object({ recommendationId: z.string().min(1).max(80) });
export const priceAlertSchema = recommendationIdSchema.extend({ email: z.string().trim().toLowerCase().email().max(254) });
export const travelFeedbackSchema = z.object({
  requestId: z.string().min(1).max(80).optional(),
  recommendationId: z.string().min(1).max(80).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().or(z.literal('')),
}).superRefine((value, ctx) => {
  if (Number(Boolean(value.requestId)) + Number(Boolean(value.recommendationId)) !== 1) {
    ctx.addIssue({ code: 'custom', path: ['requestId'], message: 'Provide exactly one feedback target.' });
  }
});

export type CreateTravelRequestInput = z.infer<typeof createTravelRequestSchema>;
export type PriceAlertInput = z.infer<typeof priceAlertSchema>;
export type TravelFeedbackInput = z.infer<typeof travelFeedbackSchema>;
