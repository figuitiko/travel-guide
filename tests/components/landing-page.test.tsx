import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '@/app/page';

describe('landing page', () => {
  it('renders the PDF-inspired budget-first landing story', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1, name: /tell us your budget/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /plan my trip/i })[0]).toHaveAttribute('href', '/plan');
    expect(screen.getByText(/tell us your budget/i, { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText(/get three trip ideas/i)).toBeInTheDocument();
    expect(screen.getByText(/see the full plan/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /a few trips people have found/i })).toBeInTheDocument();
    expect(screen.getByText(/oaxaca, mexico/i)).toBeInTheDocument();
    expect(screen.getByText(/prices shown are estimates/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ready when you are/i })).toBeInTheDocument();
  });
});
