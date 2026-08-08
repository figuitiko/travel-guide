import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetPlayground } from '@/components/trip/budget-playground';

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

const request = { budget: 2100, travelers: 2, departure: 'Mexico City' };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
  });
  vi.stubGlobal('crypto', { randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111') });
});

describe('BudgetPlayground', () => {
  it('renders live totals, accessible sliders, presets, reset, and shopping links', async () => {
    const user = userEvent.setup();
    render(<BudgetPlayground recommendation={recommendation} request={request} />);

    expect(screen.getByRole('heading', { name: /budget playground/i })).toBeInTheDocument();
    expect(screen.getByText(/USD 2,000/)).toBeInTheDocument();
    expect(screen.getByText(/USD 1,000 per traveler/)).toBeInTheDocument();
    expect(screen.getByText(/USD 100 left/)).toBeInTheDocument();

    const stay = screen.getByRole('slider', { name: /stay/i });
    stay.focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText(/custom scenario/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /comfortable/i }));
    expect(screen.getByText(/over budget/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /bring me back under budget/i }));
    expect(screen.getByText(/left/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset to recommendation/i }));
    expect(screen.getByText(/USD 2,000/)).toBeInTheDocument();

    const flightLink = screen.getByRole('link', { name: /find flights/i });
    expect(flightLink).toHaveAttribute('href', expect.stringContaining('Mexico%20City%20to%20Oaxaca%20City'));
    await user.click(flightLink);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({ method: 'POST' })));
  });

  it('shows a non-blocking fallback when detailed budget fields are missing', () => {
    render(<BudgetPlayground recommendation={{ ...recommendation, flightEstimate: null }} request={request} />);

    expect(screen.getByText(/detailed planning unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});
