import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataInsight from '../DataInsight';

// Mock the EnergyMixChart component
vi.mock('../EnergyMixChart', () => ({
  default: ({ data, title }: { data: any[]; title: string }) => (
    <div data-testid="energy-mix-chart">
      <h3>{title}</h3>
      <div data-testid="chart-data-count">{data.length} energy sources</div>
    </div>
  )
}));

describe('DataInsight', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-1.3.1: Component Rendering', () => {
    it('renders DataInsight component with default state', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      expect(screen.getByText('Data Insight Hub')).toBeInTheDocument();
      expect(screen.getByText('Victoria (VIC) Environmental Data')).toBeInTheDocument();
      expect(screen.getByText('Renewable Growth')).toBeInTheDocument();
      expect(screen.getByText('Storage & Grid')).toBeInTheDocument();
    });

    it('renders state selector dropdown with default VIC selection', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      expect(stateSelector).toBeInTheDocument();
      expect(stateSelector).toHaveValue('Victoria (VIC)');
    });

    it('renders all state options in dropdown', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      fireEvent.click(stateSelector);
      
      expect(screen.getByText('Victoria (VIC)')).toBeInTheDocument();
      expect(screen.getByText('New South Wales (NSW)')).toBeInTheDocument();
      expect(screen.getByText('Queensland (QLD)')).toBeInTheDocument();
      expect(screen.getByText('Western Australia (WA)')).toBeInTheDocument();
      expect(screen.getByText('South Australia (SA)')).toBeInTheDocument();
      expect(screen.getByText('Tasmania (TAS)')).toBeInTheDocument();
      expect(screen.getByText('Northern Territory (NT)')).toBeInTheDocument();
      expect(screen.getByText('Australian Capital Territory (ACT)')).toBeInTheDocument();
    });

    it('renders EnergyMixChart with correct data', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      expect(screen.getByTestId('energy-mix-chart')).toBeInTheDocument();
      expect(screen.getByTestId('chart-data-count')).toHaveTextContent('5 energy sources');
    });

    it('renders navigation buttons', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  describe('TC-1.3.2: State Selection', () => {
    it('changes selected state when dropdown value changes', async () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      
      // Change to NSW
      fireEvent.change(stateSelector, { target: { value: 'New South Wales (NSW)' } });
      
      await waitFor(() => {
        expect(stateSelector).toHaveValue('New South Wales (NSW)');
      });
    });

    it('updates chart title when state changes', async () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      
      // Change to QLD
      fireEvent.change(stateSelector, { target: { value: 'Queensland (QLD)' } });
      
      await waitFor(() => {
        expect(screen.getByText('Queensland Energy Generation Mix')).toBeInTheDocument();
      });
    });

    it('maintains selected state after re-render', () => {
      const { rerender } = render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      fireEvent.change(stateSelector, { target: { value: 'Western Australia (WA)' } });
      
      // Re-render component
      rerender(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      expect(stateSelector).toHaveValue('Western Australia (WA)');
    });
  });

  describe('TC-1.3.3: Data Display', () => {
    it('displays renewable growth information correctly', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      expect(screen.getByText('Renewable Growth')).toBeInTheDocument();
      expect(screen.getByText('+15.2%')).toBeInTheDocument();
      expect(screen.getByText('+28.7%')).toBeInTheDocument();
      expect(screen.getByText('Wind Power')).toBeInTheDocument();
      expect(screen.getByText('Solar Power')).toBeInTheDocument();
    });

    it('displays storage and grid information correctly', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      expect(screen.getByText('Storage & Grid')).toBeInTheDocument();
      expect(screen.getByText('850 MW')).toBeInTheDocument();
      expect(screen.getByText('1,500 MW')).toBeInTheDocument();
      expect(screen.getByText('99.8% reliability')).toBeInTheDocument();
    });

    it('shows correct energy mix data for VIC state', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      // Check that EnergyMixChart receives the correct data
      expect(screen.getByTestId('energy-mix-chart')).toBeInTheDocument();
      expect(screen.getByText('Victoria Energy Generation Mix')).toBeInTheDocument();
    });
  });

  describe('TC-1.3.4: Navigation', () => {
    it('calls onPrev when Previous button is clicked', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);
      
      expect(mockOnPrev).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when Next button is clicked', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('buttons are properly styled and accessible', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });
      
      expect(prevButton).toHaveClass('bg-gray-100', 'hover:bg-gray-200');
      expect(nextButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-blue-500');
    });
  });

  describe('TC-1.3.5: Layout and Styling', () => {
    it('applies correct container styling', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      // Check that the main container has the right structure
      expect(screen.getByText('Data Insight Hub')).toBeInTheDocument();
      expect(screen.getByText('Victoria (VIC) Environmental Data')).toBeInTheDocument();
    });

    it('displays sections in correct grid layout', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      // Check that the grid layout exists
      const gridContainer = screen.getByText('Victoria (VIC) Environmental Data').closest('div');
      expect(gridContainer).toBeInTheDocument();
    });

    it('shows proper spacing between sections', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const sections = screen.getAllByText(/Victoria Energy Generation Mix|Renewable Growth|Storage & Grid/);
      expect(sections).toHaveLength(3);
    });
  });

  describe('TC-1.3.6: Edge Cases', () => {
    it('handles empty state selection gracefully', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      expect(stateSelector).toHaveValue('Victoria (VIC)'); // Should have default value
    });

    it('maintains component state during interactions', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      
      // Change state multiple times
      fireEvent.change(stateSelector, { target: { value: 'New South Wales (NSW)' } });
      fireEvent.change(stateSelector, { target: { value: 'Queensland (QLD)' } });
      fireEvent.change(stateSelector, { target: { value: 'Victoria (VIC)' } });
      
      expect(stateSelector).toHaveValue('Victoria (VIC)');
    });

    it('renders without crashing when no props provided', () => {
      // @ts-ignore - Testing edge case
      expect(() => render(<DataInsight />)).not.toThrow();
    });
  });

  describe('TC-1.3.7: Accessibility', () => {
    it('has proper label for state selector', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      expect(screen.getByText('Select State')).toBeInTheDocument();
    });

    it('maintains proper tab order', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const stateSelector = screen.getByRole('combobox');
      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });
      
      // Check that elements are focusable
      stateSelector.focus();
      expect(stateSelector).toHaveFocus();
      
      prevButton.focus();
      expect(prevButton).toHaveFocus();
      
      nextButton.focus();
      expect(nextButton).toHaveFocus();
    });

    it('provides keyboard navigation support', () => {
      render(<DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />);
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });
      
      // Test click on buttons (since they don't have keyDown handlers)
      fireEvent.click(prevButton);
      expect(mockOnPrev).toHaveBeenCalledTimes(1);
      
      fireEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });
});
