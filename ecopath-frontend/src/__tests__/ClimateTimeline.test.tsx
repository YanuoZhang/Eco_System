import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClimateTimeline from '@/components/timeline/ClimateTimeline';

describe('ClimateTimeline', () => {
  it('renders heading and period nav', () => {
    render(<ClimateTimeline />);
    expect(screen.getByRole('heading', { name: /How We Got Here/i })).toBeInTheDocument();
    // first and last period tags exist (may appear twice: badge and nav button)
    expect(screen.getAllByText('1880-1950').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2020-2030').length).toBeGreaterThan(0);
  });

  it('changes active step when clicking a period', () => {
    render(<ClimateTimeline />);
    // default active title should be the first step
    expect(screen.getByRole('heading', { name: /Industrial Revolution Begins/i })).toBeInTheDocument();

    const targetBtn = screen.getByRole('button', { name: /1990-2010/ });
    fireEvent.click(targetBtn);

    // after click, card title should update
    expect(screen.getByRole('heading', { name: /First Climate Signals/i })).toBeInTheDocument();
  });

  it('navigates with Prev/Next and updates dots', () => {
    render(<ClimateTimeline />);
    const next = screen.getByRole('button', { name: /Next/i });
    const prev = screen.getByRole('button', { name: /Prev/i });

    // initial: prev disabled
    expect(prev).toBeDisabled();

    // go next twice
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByRole('heading', { name: /First Climate Signals/i })).toBeInTheDocument();

    // dots: one active dot should have scale-125 class; approximate by querying buttons and checking one matches
    const dotButtons = document.querySelectorAll('button');
    const hasActiveDot = Array.from(dotButtons).some((b) => /scale-125/.test(b.className));
    expect(hasActiveDot).toBe(true);

    // go prev once
    fireEvent.click(prev);
    expect(screen.getByRole('heading', { name: /The Great Acceleration/i })).toBeInTheDocument();
  });
});


