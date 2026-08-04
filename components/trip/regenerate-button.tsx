'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { regenerateTripRecommendations } from '@/app/actions';
export function RegenerateButton({ requestId }: { requestId: string }) { const [pending, start] = useTransition(); const router = useRouter(); return <button className="btn secondary" disabled={pending} onClick={() => start(async () => { const r = await regenerateTripRecommendations({ requestId }); if (r.ok) { toast.success('Fresh trips generated.'); router.refresh(); } else toast.error(r.error.message); })}>{pending ? 'Refreshing…' : 'Regenerate'}</button>; }
