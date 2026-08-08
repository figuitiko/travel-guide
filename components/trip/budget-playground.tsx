'use client';

import { useEffect, useMemo, useState } from 'react';
import { ESTIMATE_DISCLAIMER } from '@/lib/constants';
import {
  applyBudgetPreset,
  bringBudgetPlanUnderBudget,
  buildBudgetPlan,
  buildShoppingLinks,
  supportsDetailedBudget,
  type BudgetPreset,
  type BudgetRecommendationInput,
  type BudgetRequestInput,
  type BudgetValues,
} from '@/lib/travel/budget-playground';

type Props = {
  recommendation: BudgetRecommendationInput & { id: string; title: string };
  request: BudgetRequestInput;
};

const formatMoney = (currency: string, value: number) => `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function anonId() {
  const key = 'trippossible_anon';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function track(name: string, properties: Record<string, string | number | boolean | null>) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, anonymousId: anonId(), properties }),
  }).catch(() => undefined);
}

export function BudgetPlayground({ recommendation, request }: Props) {
  const [overrides, setOverrides] = useState<Partial<BudgetValues>>({});
  const [scenario, setScenario] = useState('Balanced recommendation');
  const detailed = supportsDetailedBudget(recommendation);
  const plan = useMemo(() => buildBudgetPlan(recommendation, request, overrides), [recommendation, request, overrides]);
  const links = useMemo(() => buildShoppingLinks({ departure: request.departure, destination: recommendation.destination, startDate: recommendation.startDate, endDate: recommendation.endDate, travelers: request.travelers }), [recommendation.destination, recommendation.endDate, recommendation.startDate, request.departure, request.travelers]);

  useEffect(() => {
    track('budget_playground_opened', { recommendationId: recommendation.id });
  }, [recommendation.id]);

  if (!detailed) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="budget-playground-title">
        <h2 id="budget-playground-title" className="text-xl font-black">Budget playground</h2>
        <p className="mt-2 text-sm text-stone-700">Detailed planning unavailable for this saved estimate. Generate or regenerate the trip to unlock flights and food controls.</p>
        <p className="mt-4 text-sm text-stone-600">{ESTIMATE_DISCLAIMER}</p>
      </section>
    );
  }

  function updateCategory(key: keyof BudgetValues, value: number) {
    const category = plan.categories.find((item) => item.key === key);
    const nextValue = category ? Math.min(category.max, Math.max(category.min, value)) : value;
    setOverrides((current) => ({ ...current, [key]: nextValue }));
    setScenario('Custom scenario');
    track('budget_category_adjusted', { recommendationId: recommendation.id, category: key, value: nextValue });
  }

  function choosePreset(preset: BudgetPreset) {
    const next = applyBudgetPreset(recommendation, request, preset);
    setOverrides(next.values);
    setScenario(`${preset[0]!.toUpperCase()}${preset.slice(1)} scenario`);
    track('budget_preset_selected', { recommendationId: recommendation.id, preset });
  }

  function reset() {
    setOverrides({});
    setScenario('Balanced recommendation');
    track('budget_reset', { recommendationId: recommendation.id });
  }

  function recover() {
    const next = bringBudgetPlanUnderBudget(plan);
    setOverrides(next.values);
    setScenario('Recovered budget scenario');
    track('budget_recovery_clicked', { recommendationId: recommendation.id, previousOverage: plan.overage });
  }

  return (
    <section className="rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm md:p-6" aria-labelledby="budget-playground-title">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700">Plan the spend</p>
          <h2 id="budget-playground-title" className="mt-1 text-2xl font-black text-stone-950">Budget playground</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">Adjust the big cost levers before you shop. These are estimates, not live quotes or booking guarantees.</p>
        </div>
        <div className="rounded-3xl bg-stone-950 px-5 py-4 text-white" aria-live="polite">
          <p className="text-sm text-white/70">{scenario}</p>
          <p className="text-3xl font-black">{formatMoney(plan.currency, plan.total)}</p>
          <p className="text-sm text-white/75">{formatMoney(plan.currency, plan.perTraveler)} per traveler</p>
          <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${plan.isOverBudget ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{plan.isOverBudget ? `${formatMoney(plan.currency, plan.overage)} over budget` : `${formatMoney(plan.currency, plan.remainingBudget)} left`}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Budget presets">
        {(['budget', 'balanced', 'comfortable'] as const).map((preset) => <button className="rounded-full border border-amber-200 px-4 py-2 text-sm font-black capitalize text-stone-800 hover:bg-amber-50" key={preset} type="button" onClick={() => choosePreset(preset)}>{preset}</button>)}
        {plan.isOverBudget ? <button className="rounded-full bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-700" type="button" onClick={recover}>Bring me back under budget</button> : null}
        <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-black text-stone-700 hover:bg-stone-50" type="button" onClick={reset}>Reset to recommendation</button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {plan.categories.map((category) => (
          <label className="rounded-3xl border border-stone-200 bg-stone-50 p-4" key={category.key}>
            <span className="flex items-center justify-between gap-4 text-sm font-black text-stone-900"><span>{category.label}</span><span>{formatMoney(plan.currency, category.value)}</span></span>
            <input
              aria-label={category.label}
              className="mt-3 w-full accent-amber-700"
              type="range"
              min={category.min}
              max={category.max}
              step="10"
              value={category.value}
              onChange={(event) => updateCategory(category.key, Number(event.currentTarget.value))}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
                  event.preventDefault();
                  updateCategory(category.key, category.value + 10);
                }
                if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  updateCategory(category.key, category.value - 10);
                }
              }}
            />
            <span className="mt-1 flex justify-between text-xs text-stone-500"><span>{formatMoney(plan.currency, category.min)}</span><span>{formatMoney(plan.currency, category.max)}</span></span>
          </label>
        ))}
      </div>

      <div className="mt-6 rounded-3xl bg-amber-50 p-4">
        <h3 className="font-black text-stone-950">Shop the pieces transparently</h3>
        <p className="mt-1 text-sm text-stone-600">These open search pages in a new tab. TripPossible does not sell bookings or guarantee availability.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {links.map((link) => <a className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-amber-800 shadow-sm hover:bg-amber-100" href={link.href} key={link.key} target="_blank" rel="noreferrer" onClick={() => track('shopping_link_clicked', { recommendationId: recommendation.id, link: link.key })}>{link.label}</a>)}
        </div>
      </div>
    </section>
  );
}
