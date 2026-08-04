import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ANALYTICS_EVENTS } from '@/lib/constants';
import { recordEvent } from '@/lib/analytics/events';
const schema = z.object({ name: z.enum(ANALYTICS_EVENTS), anonymousId: z.string().uuid().optional(), properties: z.record(z.string(), z.union([z.string().max(120), z.number(), z.boolean(), z.null()])).default({}) });
export async function POST(request: Request) { const body = await request.json().catch(() => null); const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 }); await recordEvent(parsed.data.name, parsed.data.properties, parsed.data.anonymousId); return NextResponse.json({ ok: true }); }
