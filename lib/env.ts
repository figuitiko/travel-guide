import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);
const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const envSchema = z.object({
  DATABASE_URL: optionalUrl,
  TEST_DATABASE_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optionalUrl,
  RATE_LIMIT_SECRET: z.preprocess(emptyToUndefined, z.string().min(12).optional()),
  OPENAI_API_KEY: optionalSecret,
  USE_MOCK_AI: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).default('false')),
  NODE_ENV: z.string().optional(),
});

export function parseEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined>) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    console.error('invalid_environment_configuration', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration.');
  }
  return parsed.data;
}

export const env = parseEnv(process.env);

export function requireServerEnv() {
  const required = z.object({
    DATABASE_URL: z.url(),
    RATE_LIMIT_SECRET: z.string().min(12),
    NEXT_PUBLIC_APP_URL: z.url(),
  });
  return required.parse({
    DATABASE_URL: env.DATABASE_URL,
    RATE_LIMIT_SECRET: env.RATE_LIMIT_SECRET,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  });
}

export const useMockAi = env.USE_MOCK_AI === 'true';
