import { describe, expect, it } from 'vitest';
import {
  applyBudgetPreset,
  bringBudgetPlanUnderBudget,
  buildBudgetPlan,
  buildShoppingLinks,
  resetBudgetPlan,
  supportsDetailedBudget,
} from '@/lib/travel/budget-playground';

const recommendation = {
  id: 'rec_123',
  title: 'Oaxaca food-and-culture escape',
  destination: 'Oaxaca City',
  currency: 'USD',
  startDate: '2026-10-01',
  endDate: '2026-10-04',
  flightEstimate: 400,
  accommodationEstimate: 700,
  foodEstimate: 320,
  transitEstimate: 180,
  experienceEstimate: 260,
  bufferEstimate: 140,
  totalEstimatedCost: 2000,
};

const request = { budget: 2500, travelers: 2, departure: 'Mexico City' };

describe('budget playground math', () => {
  it('builds total, per-traveler, remaining budget, and category rows from the recommendation', () => {
    const plan = buildBudgetPlan(recommendation, request);

    expect(plan.total).toBe(2000);
    expect(plan.perTraveler).toBe(1000);
    expect(plan.remainingBudget).toBe(500);
    expect(plan.isOverBudget).toBe(false);
    expect(plan.categories.map((category) => category.key)).toEqual(['flight', 'stay', 'food', 'transport', 'activities', 'buffer']);
  });

  it('clamps category values to safe bounds when a user drags beyond limits', () => {
    const plan = buildBudgetPlan(recommendation, request, { flight: 10_000, activities: -100 });

    expect(plan.values.flight).toBe(720);
    expect(plan.values.activities).toBe(0);
    expect(plan.total).toBe(2060);
  });

  it('applies Budget and Comfortable presets around Balanced recommendation values', () => {
    const budget = applyBudgetPreset(recommendation, request, 'budget');
    const balanced = applyBudgetPreset(recommendation, request, 'balanced');
    const comfortable = applyBudgetPreset(recommendation, request, 'comfortable');

    expect(balanced.total).toBe(2000);
    expect(budget.total).toBeLessThan(balanced.total);
    expect(comfortable.total).toBeGreaterThan(balanced.total);
    expect(budget.values.stay).toBeLessThan(balanced.values.stay);
    expect(comfortable.values.food).toBeGreaterThan(balanced.values.food);
  });

  it('allows over-budget plans and reports exact overage', () => {
    const plan = buildBudgetPlan(recommendation, { ...request, budget: 1500 }, { stay: 1000, food: 450 });

    expect(plan.isOverBudget).toBe(true);
    expect(plan.remainingBudget).toBe(-930);
    expect(plan.overage).toBe(930);
  });

  it('brings flexible categories back under budget without changing flights', () => {
    const overBudget = buildBudgetPlan(recommendation, { ...request, budget: 1500 }, { stay: 1000, food: 450 });
    const recovered = bringBudgetPlanUnderBudget(overBudget);

    expect(recovered.values.flight).toBe(overBudget.values.flight);
    expect(recovered.total).toBeLessThanOrEqual(1500);
    expect(recovered.isOverBudget).toBe(false);
  });

  it('resets customized values to the original generated recommendation', () => {
    const customized = buildBudgetPlan(recommendation, request, { stay: 1000, food: 500 });
    const reset = resetBudgetPlan(customized);

    expect(reset.values.stay).toBe(700);
    expect(reset.values.food).toBe(320);
    expect(reset.total).toBe(2000);
  });

  it('detects missing detailed budget fields for migrated recommendations', () => {
    expect(supportsDetailedBudget(recommendation)).toBe(true);
    expect(supportsDetailedBudget({ ...recommendation, flightEstimate: undefined })).toBe(false);
    expect(supportsDetailedBudget({ ...recommendation, foodEstimate: null })).toBe(false);
  });
});

describe('shopping links', () => {
  it('builds encoded provider search URLs without exposing booking guarantees', () => {
    const links = buildShoppingLinks({
      departure: 'Mexico City',
      destination: 'Oaxaca City',
      startDate: '2026-10-01',
      endDate: '2026-10-04',
      travelers: 2,
    });

    expect(links.map((link) => link.key)).toEqual(['flights', 'stays', 'activities', 'transport']);
    expect(links[0]!.href).toContain('tbm=flm');
    expect(links[0]!.href).toContain('Mexico%20City%20to%20Oaxaca%20City');
    expect(links[1]!.href).toContain('Oaxaca%20City%20hotel%202%20travelers%202026-10-01%202026-10-04');
    expect(links.every((link) => link.href.startsWith('https://www.google.com/search?'))).toBe(true);
  });
});
