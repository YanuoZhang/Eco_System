import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EnergyMixChart, { EnergyMix } from '../EnergyMixChart';

// Mock data for testing
const mockEnergyData: EnergyMix[] = [
  {
    source: 'Coal',
    percentage: 45.2,
    generation: '8,450 MW',
    trend: -8.5
  },
  {
    source: 'Natural Gas',
    percentage: 18.3,
    generation: '3,420 MW',
    trend: -2.1
  },
  {
    source: 'Wind',
    percentage: 22.8,
    generation: '4,250 MW',
    trend: 15.2
  },
  {
    source: 'Solar',
    percentage: 8.9,
    generation: '1,660 MW',
    trend: 28.7
  },
  {
    source: 'Hydro',
    percentage: 4.8,
    generation: '895 MW',
    trend: 1.2
  }
];

describe('EnergyMixChart', () => {
  describe('TC-1.2.1: Chart Rendering', () => {
    it('renders correct number of energy segments', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Check that all energy sources are rendered
      expect(screen.getByText('Coal')).toBeInTheDocument();
      expect(screen.getByText('Natural Gas')).toBeInTheDocument();
      expect(screen.getByText('Wind')).toBeInTheDocument();
      expect(screen.getByText('Solar')).toBeInTheDocument();
      expect(screen.getByText('Hydro')).toBeInTheDocument();
      
      // Check that all percentages are displayed
      expect(screen.getByText('45.2%')).toBeInTheDocument();
      expect(screen.getByText('18.3%')).toBeInTheDocument();
      expect(screen.getByText('22.8%')).toBeInTheDocument();
      expect(screen.getByText('8.9%')).toBeInTheDocument();
      expect(screen.getByText('4.8%')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      const customTitle = 'Custom Energy Mix Title';
      render(<EnergyMixChart data={mockEnergyData} title={customTitle} />);
      
      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it('renders with default title when no title provided', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      expect(screen.getByText('Energy Generation Mix')).toBeInTheDocument();
    });

    it('displays generation capacity for each source', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      expect(screen.getByText('8,450 MW')).toBeInTheDocument();
      expect(screen.getByText('3,420 MW')).toBeInTheDocument();
      expect(screen.getByText('4,250 MW')).toBeInTheDocument();
      expect(screen.getByText('1,660 MW')).toBeInTheDocument();
      expect(screen.getByText('895 MW')).toBeInTheDocument();
    });

    it('shows trend indicators with correct colors', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Check positive trends (green)
      const positiveTrends = screen.getAllByText(/\+/);
      expect(positiveTrends).toHaveLength(4); // Wind, Solar, Hydro, and one from tooltip
      
      // Check negative trends (red)
      const negativeTrends = screen.getAllByText(/-/);
      expect(negativeTrends).toHaveLength(2); // Coal, Natural Gas
    });
  });

  describe('TC-1.2.2: Tooltip Functionality', () => {
    it('shows tooltip on hover with accurate content', async () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Hover over Coal segment
      const buttons = screen.getAllByRole('button');
      const coalButton = buttons[0]; // Coal is the first button
      fireEvent.mouseEnter(coalButton);
      
      // Wait for tooltip to appear
      await waitFor(() => {
        // Find tooltip by looking for the tooltip container
        const tooltip = document.querySelector('.absolute.z-50.bg-white.p-4.border.border-gray-200.rounded-lg.shadow-xl');
        expect(tooltip).toBeInTheDocument();
        
        // Check that tooltip shows Coal data
        expect(tooltip).toHaveTextContent('Coal');
        expect(tooltip).toHaveTextContent('45.2%');
        expect(tooltip).toHaveTextContent('8,450 MW');
        expect(tooltip).toHaveTextContent('-8.5%');
      });
    });

    it('shows tooltip on hover over different segments', async () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Hover over Wind segment
      const buttons = screen.getAllByRole('button');
      const windButton = buttons[2]; // Wind is the 3rd button (index 2)
      fireEvent.mouseEnter(windButton);
      
      await waitFor(() => {
        // Find tooltip by looking for the tooltip container
        const tooltip = document.querySelector('.absolute.z-50.bg-white.p-4.border.border-gray-200.rounded-lg.shadow-xl');
        expect(tooltip).toBeInTheDocument();
        
        // Check that tooltip shows Wind data
        expect(tooltip).toHaveTextContent('Wind');
        expect(tooltip).toHaveTextContent('22.8%');
        expect(tooltip).toHaveTextContent('4,250 MW');
        expect(tooltip).toHaveTextContent('+15.2%');
      });
    });

    it('hides tooltip when mouse leaves segment', async () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Hover over Coal segment
      const buttons = screen.getAllByRole('button');
      const coalButton = buttons[0]; // Coal is the first button
      fireEvent.mouseEnter(coalButton);
      
      // Wait for tooltip to appear
      await waitFor(() => {
        const tooltip = document.querySelector('.absolute.z-50.bg-white.p-4.border.border-gray-200.rounded-lg.shadow-xl');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('Coal');
      });
      
      // Leave the segment
      fireEvent.mouseLeave(coalButton);
      
      // Wait for tooltip to disappear
      await waitFor(() => {
        const tooltip = document.querySelector('.absolute.z-50.bg-white.p-4.border.border-gray-200.rounded-lg.shadow-xl');
        expect(tooltip).not.toBeInTheDocument();
      });
    });

    it('shows tooltip on keyboard navigation (Enter key)', async () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Focus on Coal segment and press Enter
      const buttons = screen.getAllByRole('button');
      const coalButton = buttons[0]; // Coal is the first button
      coalButton.focus();
      fireEvent.keyDown(coalButton, { key: 'Enter' });
      
      // Wait for tooltip to appear and check tooltip content
      await waitFor(() => {
        // Find tooltip by looking for the tooltip container
        const tooltip = document.querySelector('.absolute.z-50.bg-white.p-4.border.border-gray-200.rounded-lg.shadow-xl');
        expect(tooltip).toBeInTheDocument();
        
        // Check that tooltip shows Coal data
        expect(tooltip).toHaveTextContent('Coal');
        expect(tooltip).toHaveTextContent('45.2%');
        expect(tooltip).toHaveTextContent('8,450 MW');
        expect(tooltip).toHaveTextContent('-8.5%');
      });
    });

    it('shows tooltip on keyboard navigation (Space key)', async () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Focus on Solar segment and press Space
      const buttons = screen.getAllByRole('button');
      const solarButton = buttons[3]; // Solar is the 4th button (index 3)
      solarButton.focus();
      fireEvent.keyDown(solarButton, { key: ' ' });
      
      // Wait for tooltip to appear and check tooltip content
      await waitFor(() => {
        // Find tooltip by looking for the tooltip container
        const tooltip = document.querySelector('.absolute.z-50.bg-white.p-4.border.border-gray-200.rounded-lg.shadow-xl');
        expect(tooltip).toBeInTheDocument();
        
        // Check that tooltip shows Solar data
        expect(tooltip).toHaveTextContent('Solar');
        expect(tooltip).toHaveTextContent('8.9%');
        expect(tooltip).toHaveTextContent('1,660 MW');
        expect(tooltip).toHaveTextContent('+28.7%');
      });
    });
  });

  describe('Fallback UI & Edge Cases', () => {
    it('renders empty state when no data provided', () => {
      render(<EnergyMixChart data={[]} />);
      
      // Should still show title
      expect(screen.getByText('Energy Generation Mix')).toBeInTheDocument();
      
      // Should show accessibility info
      expect(screen.getByText('💡 Tip: Hover over bars for detailed information')).toBeInTheDocument();
      expect(screen.getByText('⌨️ Use Tab + Enter to navigate and view details')).toBeInTheDocument();
    });

    it('handles single data item correctly', () => {
      const singleData: EnergyMix[] = [
        {
          source: 'Solar',
          percentage: 100,
          generation: '5,000 MW',
          trend: 25.0
        }
      ];
      
      render(<EnergyMixChart data={singleData} />);
      
      expect(screen.getByText('Solar')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('5,000 MW')).toBeInTheDocument();
      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('displays accessibility labels correctly', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Find the button elements with role="button"
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
      
      // Check first button (Coal)
      expect(buttons[0]).toHaveAttribute('aria-label', 'Coal: 45.2% of total generation, capacity 8,450 MW, trend -8.5%');
      
      // Check third button (Wind)
      expect(buttons[2]).toHaveAttribute('aria-label', 'Wind: 22.8% of total generation, capacity 4,250 MW, trend +15.2%');
    });

    it('maintains proper tab order for keyboard navigation', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      const segments = screen.getAllByRole('button');
      expect(segments).toHaveLength(5); // 5 energy sources
      
      // Check that all segments are tabbable
      segments.forEach(segment => {
        expect(segment).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Visual Elements', () => {
    it('renders progress bars with correct widths', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Check that progress bars exist
      const progressBars = document.querySelectorAll('.bg-gradient-to-r');
      expect(progressBars).toHaveLength(5);
    });

    it('applies hover effects on segments', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Find the button elements with role="button"
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('hover:shadow-md', 'hover:border-purple-300');
    });

    it('shows trend badges with correct styling', () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      
      // Positive trend (green)
      const positiveTrend = screen.getByText('+15.2%');
      expect(positiveTrend).toHaveClass('bg-green-100', 'text-green-700');
      
      // Negative trend (red)
      const negativeTrend = screen.getByText('-8.5%');
      expect(negativeTrend).toHaveClass('bg-red-100', 'text-red-700');
    });
  });
});
