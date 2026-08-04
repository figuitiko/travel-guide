import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/db';

export function hashIdentity(identity: string, secret = process.env.RATE_LIMIT_SECRET ?? 'development-rate-secret') {
  return createHmac('sha256', secret).update(identity).digest('hex');
}
export async function assertGenerationRateLimit(identity: string, requestId: string) {
  const key = hashIdentity(identity);
  const now = Date.now();
  const fifteen = new Date(now - 15 * 60_000);
  const day = new Date(now - 24 * 60 * 60_000);
  const [identityCount, requestCount] = await Promise.all([
    prisma.rateLimitAttempt.count({ where: { key, scope: 'generation_identity', createdAt: { gte: fifteen } } }),
    prisma.rateLimitAttempt.count({ where: { requestId, scope: 'generation_request', createdAt: { gte: day } } }),
  ]);
  if (identityCount >= 3 || requestCount >= 5) throw new Error('RATE_LIMITED');
  await prisma.rateLimitAttempt.createMany({ data: [{ key, scope: 'generation_identity' }, { key, scope: 'generation_request', requestId }] });
}
