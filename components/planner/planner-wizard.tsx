'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useRef, useState } from 'react';
import { type FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { INTERESTS, SUPPORTED_CURRENCIES } from '@/lib/constants';
import { createTravelRequestSchema } from '@/lib/travel/schemas';
import type { z } from 'zod';
import type { ActionResult } from '@/lib/actions/result';

type PlannerFormValues = z.input<typeof createTravelRequestSchema>;
type Props = {
  onCreateRequest: (input: unknown) => Promise<ActionResult<{ requestId: string }>>;
  onGenerate: (input: { requestId: string }) => Promise<ActionResult<{ recommendationIds: string[] }>>;
};
const steps = ['Origin', 'Budget', 'Dates', 'Review'];

export function PlannerWizard({ onCreateRequest, onGenerate }: Props) {
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const firstField = useRef<HTMLInputElement | HTMLSelectElement | null>(null);
  const router = useRouter();
  const fields = useMemo(() => ([['departure', 'travelers'], ['budget', 'currency', 'accommodation'], ['tripLengthDays', 'earliestDeparture', 'latestReturn', 'flexibility'], ['interests', 'pace']] as const), []);
  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(createTravelRequestSchema),
    mode: 'onSubmit',
    defaultValues: { departure: '', travelers: 1, budget: 2500, currency: 'USD', accommodation: 'comfortable hotel', tripLengthDays: 4, earliestDeparture: '2026-10-01', latestReturn: '2026-10-20', flexibility: 'Flexible by a few days', interests: [], pace: 'balanced' },
  });
  function friendlyStepError(errors?: FieldErrors<PlannerFormValues>) {
    if (errors?.departure || form.getFieldState('departure').error) return 'Departure city is required before continuing.';
    if (errors?.travelers || form.getFieldState('travelers').error) return 'Travelers must be between 1 and 10.';
    if (errors?.budget || form.getFieldState('budget').error) return 'Budget must be a positive amount.';
    if (errors?.currency || form.getFieldState('currency').error) return 'Choose a supported currency.';
    if (errors?.accommodation || form.getFieldState('accommodation').error) return 'Tell us your accommodation preference.';
    if (errors?.tripLengthDays || errors?.earliestDeparture || errors?.latestReturn || form.getFieldState('tripLengthDays').error || form.getFieldState('earliestDeparture').error || form.getFieldState('latestReturn').error) return 'Choose a valid date window that fits the full trip.';
    if (errors?.interests || form.getFieldState('interests').error) return 'Choose at least one interest.';
    if (errors?.pace || form.getFieldState('pace').error) return 'Tell us the pace you want.';
    return 'Please check the highlighted field.';
  }
  async function next() {
    setError('');
    const ok = await form.trigger(fields[step], { shouldFocus: true });
    if (!ok) { setError(friendlyStepError()); firstField.current?.focus(); return; }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  async function submit(values: PlannerFormValues) {
    setPending(true); setError('');
    startTransition(async () => {
      const created = await onCreateRequest(values);
      if (!created.ok) { setError(created.error.message); setPending(false); return; }
      const generated = await onGenerate({ requestId: created.data.requestId });
      if (!generated.ok) { setError(generated.error.message); toast.error('Generation needs a retry.'); setPending(false); return; }
      router.push(`/plan/results/${created.data.requestId}`);
    });
  }
  function onInvalid(errors: FieldErrors<PlannerFormValues>) {
    setError(friendlyStepError(errors));
  }
  return <form onSubmit={form.handleSubmit(submit, onInvalid)} className="space-y-6" aria-describedby="planner-status">
    <div className="rounded-full bg-amber-100 px-4 py-2 text-sm text-stone-700" aria-live="polite">Step {step + 1} of 4 · {steps[step]}</div>
    {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {step === 0 && <section className="grid gap-4">
      <label>Departure city<input className="input" {...form.register('departure')} ref={(e) => { form.register('departure').ref(e); firstField.current = e; }} /></label>
      <label>Travelers<input className="input" type="number" {...form.register('travelers')} /></label>
    </section>}
    {step === 1 && <section className="grid gap-4">
      <label>Trip budget<input className="input" type="number" {...form.register('budget')} ref={(e) => { form.register('budget').ref(e); firstField.current = e; }} /></label>
      <label>Currency<select className="input" {...form.register('currency')}>{SUPPORTED_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Accommodation<input className="input" {...form.register('accommodation')} /></label>
    </section>}
    {step === 2 && <section className="grid gap-4">
      <label>Trip length<input className="input" type="number" {...form.register('tripLengthDays')} ref={(e) => { form.register('tripLengthDays').ref(e); firstField.current = e; }} /></label>
      <label>Earliest departure<input className="input" type="date" {...form.register('earliestDeparture')} /></label>
      <label>Latest return<input className="input" type="date" {...form.register('latestReturn')} /></label>
      <label>Flexibility<input className="input" {...form.register('flexibility')} /></label>
    </section>}
    {step === 3 && <section className="grid gap-4">
      <fieldset><legend className="mb-2 font-semibold">Interests</legend><div className="grid grid-cols-2 gap-2">{INTERESTS.map((interest) => <label key={interest} className="rounded-2xl border bg-white p-3 capitalize"><input type="checkbox" value={interest} {...form.register('interests')} /> {interest}</label>)}</div></fieldset>
      <label>Pace<input className="input" {...form.register('pace')} /></label>
      <div className="rounded-3xl bg-white p-4 shadow-sm"><strong>Review:</strong> {String(form.getValues('departure') || 'Your city')} · {String(form.getValues('currency'))} {String(form.getValues('budget'))} · {String(form.getValues('tripLengthDays'))} days</div>
    </section>}
    <div className="flex gap-3">
      {step > 0 && <button type="button" className="btn secondary" onClick={() => setStep(s => s - 1)}>Back</button>}
      {step < 3 ? <button type="button" className="btn" onClick={next}>Next</button> : <button type="submit" disabled={pending} className="btn">{pending ? 'Creating trips…' : 'Show my three trips'}</button>}
    </div>
  </form>;
}
