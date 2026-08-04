'use client';
import { useState, useTransition } from 'react';
import { createPriceAlert, submitTravelFeedback } from '@/app/actions';

export function AlertForm({ recommendationId }: { recommendationId: string }) {
  const [message, setMessage] = useState(''); const [pending, start] = useTransition();
  return <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); const email = new FormData(e.currentTarget).get('email'); start(async () => { const r = await createPriceAlert({ recommendationId, email }); setMessage(r.ok ? r.data.message : r.error.message); }); }}><h2 className="text-xl font-black">Watch this estimate</h2><label>Email<input className="input" name="email" type="email" required maxLength={254} /></label><button className="btn" disabled={pending}>Watch this trip</button>{message && <p aria-live="polite" className="text-sm text-emerald-700">{message}</p>}</form>;
}
export function FeedbackForm({ recommendationId }: { recommendationId: string }) {
  const [rating, setRating] = useState(5); const [message, setMessage] = useState(''); const [pending, start] = useTransition();
  return <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); const comment = new FormData(e.currentTarget).get('comment'); start(async () => { const r = await submitTravelFeedback({ recommendationId, rating, comment }); setMessage(r.ok ? 'Thanks — your feedback helps us decide what to improve next.' : r.error.message); }); }}><h2 className="text-xl font-black">Was this useful?</h2><div className="flex gap-2" role="group" aria-label="Rating">{[1,2,3,4,5].map((n) => <button type="button" className={`rounded-full px-3 py-2 ${rating === n ? 'bg-amber-700 text-white' : 'bg-white'}`} key={n} onClick={() => setRating(n)} aria-pressed={rating === n}>{n}</button>)}</div><label>Comment<textarea className="input" name="comment" maxLength={500} /></label><button className="btn" disabled={pending}>Send feedback</button>{message && <p aria-live="polite" className="text-sm text-emerald-700">{message}</p>}</form>;
}
