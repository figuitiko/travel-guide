import { ZodError } from 'zod';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
export const actionOk = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export function toActionError(error: unknown, code = 'BAD_REQUEST', message = 'Something went wrong. Please try again.'): ActionResult<never> {
  if (error instanceof ZodError) return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', fieldErrors: error.flatten().fieldErrors as Record<string, string[]> } };
  return { ok: false, error: { code, message } };
}
