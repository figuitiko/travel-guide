import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/lib/env';

describe('environment parsing', () => {
  it('treats empty optional secrets as unset', () => {
    const parsed = parseEnv({
      DATABASE_URL: 'postgresql://user:pass@example.com:5432/app?sslmode=require',
      RATE_LIMIT_SECRET: 'a-long-enough-secret',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      OPENAI_API_KEY: '',
      USE_MOCK_AI: 'true',
    });

    expect(parsed.OPENAI_API_KEY).toBeUndefined();
    expect(parsed.USE_MOCK_AI).toBe('true');
  });
});
