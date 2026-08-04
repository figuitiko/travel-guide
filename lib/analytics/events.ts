import { ANALYTICS_EVENTS } from '@/lib/constants';
import { prisma } from '@/lib/db';

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
export async function recordEvent(name: AnalyticsEventName, properties: Record<string, string | number | boolean | null> = {}, anonymousId?: string) {
  try {
    if (!ANALYTICS_EVENTS.includes(name)) return;
    await prisma.analyticsEvent.create({ data: { name, anonymousId, properties } });
  } catch (error) {
    console.error('analytics_record_failed', { name, error: error instanceof Error ? error.message : 'unknown' });
  }
}
