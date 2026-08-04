import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlannerWizard } from '@/components/planner/planner-wizard';

describe('PlannerWizard', () => {
  it('preserves values while navigating backward and forward', async () => {
    const user = userEvent.setup();
    render(<PlannerWizard onCreateRequest={vi.fn()} onGenerate={vi.fn()} />);
    await user.type(screen.getByLabelText(/departure city/i), 'Mexico City');
    await user.clear(screen.getByLabelText(/travelers/i));
    await user.type(screen.getByLabelText(/travelers/i), '2');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await expect(screen.findByLabelText(/trip budget/i)).resolves.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByLabelText(/departure city/i)).toHaveValue('Mexico City');
  });

  it('focuses the first invalid field and prevents submission', async () => {
    const user = userEvent.setup();
    render(<PlannerWizard onCreateRequest={vi.fn()} onGenerate={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByLabelText(/departure city/i)).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent(/departure/i);
  });

  it('does not show interest validation just by arriving on review step', async () => {
    const user = userEvent.setup();
    render(<PlannerWizard onCreateRequest={vi.fn()} onGenerate={vi.fn()} />);

    await user.type(screen.getByLabelText(/departure city/i), 'Tlaxcala');
    await user.clear(screen.getByLabelText(/travelers/i));
    await user.type(screen.getByLabelText(/travelers/i), '1');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.clear(screen.getByLabelText(/trip budget/i));
    await user.type(screen.getByLabelText(/trip budget/i), '2500');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a friendly interest error only after submit on review step', async () => {
    const user = userEvent.setup();
    render(<PlannerWizard onCreateRequest={vi.fn()} onGenerate={vi.fn()} />);

    await user.type(screen.getByLabelText(/departure city/i), 'Tlaxcala');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /show my three trips/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/choose at least one interest/i);
  });

});
