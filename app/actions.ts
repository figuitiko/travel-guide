'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { actionOk, toActionError, type ActionResult } from '@/lib/actions/result';
import { createAlert, createRequest, generateRecommendations, submitFeedback } from '@/lib/travel/service';
import { generateSchema } from '@/lib/travel/schemas';

async function identity() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('user-agent') || 'anonymous';
}
export async function createTravelRequest(input: unknown): Promise<ActionResult<{ requestId: string }>> {
  try { return actionOk(await createRequest(input)); } catch (e) { console.error('create_request_failed', { error: e instanceof Error ? e.message : 'unknown' }); return toActionError(e); }
}
export async function generateTripRecommendations(input: unknown): Promise<ActionResult<{ recommendationIds: string[] }>> {
  try { const parsed = generateSchema.parse(input); const result = await generateRecommendations(parsed.requestId, await identity()); revalidatePath(`/plan/results/${parsed.requestId}`); return actionOk(result); } catch (e) { console.error('generate_failed', { error: e instanceof Error ? e.message : 'unknown' }); return toActionError(e, 'GENERATION_FAILED', 'We could not generate trips right now. Please retry.'); }
}
export async function regenerateTripRecommendations(input: unknown): Promise<ActionResult<{ recommendationIds: string[] }>> {
  try { const parsed = generateSchema.parse(input); const result = await generateRecommendations(parsed.requestId, await identity(), true); revalidatePath(`/plan/results/${parsed.requestId}`); return actionOk(result); } catch (e) { console.error('regenerate_failed', { error: e instanceof Error ? e.message : 'unknown' }); return toActionError(e, 'GENERATION_FAILED', 'We could not regenerate trips right now. Your current trips are still visible.'); }
}
export async function createPriceAlert(input: unknown): Promise<ActionResult<{ message: string }>> {
  try { const result = await createAlert(input); revalidatePath('/trips/[recommendationId]', 'page'); return actionOk(result); } catch (e) { console.error('alert_failed', { error: e instanceof Error ? e.message : 'unknown' }); return toActionError(e, 'ALERT_FAILED', 'We could not create that alert. Please try again.'); }
}
export async function submitTravelFeedback(input: unknown): Promise<ActionResult<{ feedbackId: string }>> {
  try { return actionOk(await submitFeedback(input)); } catch (e) { console.error('feedback_failed', { error: e instanceof Error ? e.message : 'unknown' }); return toActionError(e, 'FEEDBACK_FAILED', 'We could not save feedback. Please try again.'); }
}
