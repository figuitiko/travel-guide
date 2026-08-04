'use client';
import { useEffect } from 'react';
function anonId() { const key = 'trippossible_anon'; const existing = localStorage.getItem(key); if (existing) return existing; const id = crypto.randomUUID(); localStorage.setItem(key, id); return id; }
export function LandingAnalytics() { useEffect(() => { fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'landing_viewed', anonymousId: anonId(), properties: { path: '/' } }) }).catch(() => undefined); }, []); return null; }
