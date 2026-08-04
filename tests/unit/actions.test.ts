import { describe, expect, it } from 'vitest';
import { toActionError } from '@/lib/actions/result';

describe('action result mapping', () => {
  it('sanitizes unknown provider errors for clients', () => {
    const result = toActionError(new Error('OPENAI_API_KEY leaked stack'), 'GENERATION_FAILED');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).not.toMatch(/OPENAI|KEY|stack/i);
    else throw new Error('expected failure');
  });
});
