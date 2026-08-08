export type BudgetCategoryKey = 'flight' | 'stay' | 'food' | 'transport' | 'activities' | 'buffer';
export type BudgetPreset = 'budget' | 'balanced' | 'comfortable';

export type BudgetRecommendationInput = {
  destination: string;
  currency: string;
  startDate: string;
  endDate: string;
  flightEstimate?: number | null;
  accommodationEstimate: number;
  foodEstimate?: number | null;
  transitEstimate: number;
  experienceEstimate: number;
  bufferEstimate: number;
  totalEstimatedCost: number;
};

export type BudgetRequestInput = {
  budget: number;
  travelers: number;
  departure?: string | null;
};

export type BudgetValues = Record<BudgetCategoryKey, number>;

export type BudgetCategory = {
  key: BudgetCategoryKey;
  label: string;
  value: number;
  min: number;
  max: number;
};

export type BudgetPlan = {
  currency: string;
  budget: number;
  travelers: number;
  values: BudgetValues;
  originalValues: BudgetValues;
  categories: BudgetCategory[];
  total: number;
  perTraveler: number;
  remainingBudget: number;
  overage: number;
  isOverBudget: boolean;
};

const CATEGORY_CONFIG: Array<{ key: BudgetCategoryKey; label: string; minFactor: number; maxFactor: number }> = [
  { key: 'flight', label: 'Flights', minFactor: 0.6, maxFactor: 1.8 },
  { key: 'stay', label: 'Stay', minFactor: 0.6, maxFactor: 1.8 },
  { key: 'food', label: 'Food', minFactor: 0.6, maxFactor: 1.6 },
  { key: 'transport', label: 'Local transport', minFactor: 0.5, maxFactor: 1.6 },
  { key: 'activities', label: 'Activities', minFactor: 0, maxFactor: 1.8 },
  { key: 'buffer', label: 'Buffer', minFactor: 0, maxFactor: 2 },
];

const PRESET_FACTORS: Record<BudgetPreset, BudgetValues> = {
  budget: { flight: 1, stay: 0.82, food: 0.88, transport: 0.9, activities: 0.78, buffer: 0.5 },
  balanced: { flight: 1, stay: 1, food: 1, transport: 1, activities: 1, buffer: 1 },
  comfortable: { flight: 1.08, stay: 1.22, food: 1.18, transport: 1.08, activities: 1.22, buffer: 1.25 },
};

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function originalValues(recommendation: BudgetRecommendationInput): BudgetValues {
  return {
    flight: recommendation.flightEstimate ?? 0,
    stay: recommendation.accommodationEstimate,
    food: recommendation.foodEstimate ?? 0,
    transport: recommendation.transitEstimate,
    activities: recommendation.experienceEstimate,
    buffer: recommendation.bufferEstimate,
  };
}

function categoryBounds(key: BudgetCategoryKey, originals: BudgetValues) {
  const config = CATEGORY_CONFIG.find((category) => category.key === key)!;
  const base = originals[key];
  return { min: roundCurrency(base * config.minFactor), max: roundCurrency(base * config.maxFactor), label: config.label };
}

export function supportsDetailedBudget(recommendation: Partial<BudgetRecommendationInput>) {
  return typeof recommendation.flightEstimate === 'number' && Number.isFinite(recommendation.flightEstimate) && typeof recommendation.foodEstimate === 'number' && Number.isFinite(recommendation.foodEstimate);
}

export function buildBudgetPlan(recommendation: BudgetRecommendationInput, request: BudgetRequestInput, overrides: Partial<BudgetValues> = {}): BudgetPlan {
  const originals = originalValues(recommendation);
  const values = CATEGORY_CONFIG.reduce((next, category) => {
    const bounds = categoryBounds(category.key, originals);
    next[category.key] = roundCurrency(clamp(overrides[category.key] ?? originals[category.key], bounds.min, bounds.max));
    return next;
  }, {} as BudgetValues);
  const total = roundCurrency(Object.values(values).reduce((sum, value) => sum + value, 0));
  const travelers = Math.max(1, request.travelers);
  const remainingBudget = roundCurrency(request.budget - total);
  const categories = CATEGORY_CONFIG.map((category) => {
    const bounds = categoryBounds(category.key, originals);
    return { key: category.key, label: category.label, value: values[category.key], min: bounds.min, max: bounds.max };
  });
  return {
    currency: recommendation.currency,
    budget: request.budget,
    travelers,
    values,
    originalValues: originals,
    categories,
    total,
    perTraveler: roundCurrency(total / travelers),
    remainingBudget,
    overage: remainingBudget < 0 ? roundCurrency(Math.abs(remainingBudget)) : 0,
    isOverBudget: remainingBudget < 0,
  };
}

export function applyBudgetPreset(recommendation: BudgetRecommendationInput, request: BudgetRequestInput, preset: BudgetPreset): BudgetPlan {
  const originals = originalValues(recommendation);
  const factors = PRESET_FACTORS[preset];
  const values = CATEGORY_CONFIG.reduce((next, category) => {
    next[category.key] = roundCurrency(originals[category.key] * factors[category.key]);
    return next;
  }, {} as BudgetValues);
  return buildBudgetPlan(recommendation, request, values);
}

export function resetBudgetPlan(plan: BudgetPlan): BudgetPlan {
  return buildBudgetPlan(
    {
      destination: '',
      currency: plan.currency,
      startDate: '',
      endDate: '',
      flightEstimate: plan.originalValues.flight,
      accommodationEstimate: plan.originalValues.stay,
      foodEstimate: plan.originalValues.food,
      transitEstimate: plan.originalValues.transport,
      experienceEstimate: plan.originalValues.activities,
      bufferEstimate: plan.originalValues.buffer,
      totalEstimatedCost: Object.values(plan.originalValues).reduce((sum, value) => sum + value, 0),
    },
    { budget: plan.budget, travelers: plan.travelers },
  );
}

export function bringBudgetPlanUnderBudget(plan: BudgetPlan): BudgetPlan {
  if (!plan.isOverBudget) return plan;
  const flexible: BudgetCategoryKey[] = ['stay', 'food', 'transport', 'activities', 'buffer'];
  const values = { ...plan.values };
  let overage = plan.overage;
  const reducible = flexible.reduce((sum, key) => {
    const bounds = categoryBounds(key, plan.originalValues);
    return sum + Math.max(0, values[key] - bounds.min);
  }, 0);
  if (reducible <= 0) return plan;
  for (const key of flexible) {
    const bounds = categoryBounds(key, plan.originalValues);
    const available = Math.max(0, values[key] - bounds.min);
    const reduction = roundCurrency((available / reducible) * overage);
    values[key] = roundCurrency(Math.max(bounds.min, values[key] - reduction));
  }
  let adjusted = buildBudgetPlan(
    {
      destination: '',
      currency: plan.currency,
      startDate: '',
      endDate: '',
      flightEstimate: plan.originalValues.flight,
      accommodationEstimate: plan.originalValues.stay,
      foodEstimate: plan.originalValues.food,
      transitEstimate: plan.originalValues.transport,
      experienceEstimate: plan.originalValues.activities,
      bufferEstimate: plan.originalValues.buffer,
      totalEstimatedCost: Object.values(plan.originalValues).reduce((sum, value) => sum + value, 0),
    },
    { budget: plan.budget, travelers: plan.travelers },
    values,
  );
  if (adjusted.isOverBudget) {
    overage = adjusted.overage;
    for (const key of flexible) {
      const bounds = categoryBounds(key, plan.originalValues);
      const reduction = Math.min(overage, Math.max(0, adjusted.values[key] - bounds.min));
      values[key] = roundCurrency(adjusted.values[key] - reduction);
      overage = roundCurrency(overage - reduction);
      if (overage <= 0) break;
    }
    adjusted = buildBudgetPlan(
      {
        destination: '',
        currency: plan.currency,
        startDate: '',
        endDate: '',
        flightEstimate: plan.originalValues.flight,
        accommodationEstimate: plan.originalValues.stay,
        foodEstimate: plan.originalValues.food,
        transitEstimate: plan.originalValues.transport,
        experienceEstimate: plan.originalValues.activities,
        bufferEstimate: plan.originalValues.buffer,
        totalEstimatedCost: Object.values(plan.originalValues).reduce((sum, value) => sum + value, 0),
      },
      { budget: plan.budget, travelers: plan.travelers },
      values,
    );
  }
  return adjusted;
}

export type ShoppingLink = { key: 'flights' | 'stays' | 'activities' | 'transport'; label: string; href: string };

export function buildShoppingLinks(input: { departure?: string | null; destination: string; startDate: string; endDate: string; travelers: number }): ShoppingLink[] {
  const departure = input.departure?.trim() || 'my departure city';
  const searches: ShoppingLink[] = [
    { key: 'flights', label: 'Find flights', href: googleSearch(`${departure} to ${input.destination} flights ${input.startDate} ${input.endDate}`, { tbm: 'flm' }) },
    { key: 'stays', label: 'Find a place to stay', href: googleSearch(`${input.destination} hotel ${input.travelers} travelers ${input.startDate} ${input.endDate}`) },
    { key: 'activities', label: 'Find activities', href: googleSearch(`${input.destination} activities tours things to do ${input.startDate}`) },
    { key: 'transport', label: 'Find local transport', href: googleSearch(`${input.destination} airport transfer local transport`) },
  ];
  return searches.filter((link) => link.href.startsWith('https://www.google.com/search?'));
}

function googleSearch(query: string, extraParams: Record<string, string> = {}) {
  const params = new URLSearchParams({ q: query, ...extraParams });
  return `https://www.google.com/search?${params.toString().replace(/\+/g, '%20')}`;
}
