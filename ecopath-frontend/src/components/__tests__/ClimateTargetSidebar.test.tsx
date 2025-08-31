import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ClimateTargetSidebar from '../ClimateTargetSidebar';

// Mock the context
vi.mock('@/contexts/StateContext');

const mockProps = {
  stateName: 'Victoria',
  isLoading: false,
  error: null,
  onRetry: vi.fn()
};

describe('ClimateTargetSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-1.6.1: Component Rendering', () => {
    it('renders climate targets sidebar with valid props', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      // Wait for the component to load data
      await waitFor(() => {
        expect(screen.getByText('Reduction Goals')).toBeInTheDocument();
        expect(screen.getByText('Key Initiatives')).toBeInTheDocument();
      });
    });

    it('displays loading skeleton when isLoading is true', () => {
      render(<ClimateTargetSidebar {...mockProps} isLoading={true} />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('shows loading skeleton during data fetch', () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      // Should show loading skeleton initially
      const skeletonElements = screen.getAllByTestId('loading-skeleton');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('TC-1.6.2: Data Display and Formatting', () => {
    it('displays correct 2030 target value', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('2030 Target')).toBeInTheDocument();
        expect(screen.getByText('-45%')).toBeInTheDocument();
      });
    });

    it('shows current progress with correct formatting', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Current Progress')).toBeInTheDocument();
        expect(screen.getByText('-18%')).toBeInTheDocument();
      });
    });

    it('renders progress bar with correct width', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        const progressFill = progressBar.querySelector('div');
        expect(progressFill).toHaveStyle({ width: '18%' });
      });
    });

    it('displays key initiatives with bullet points', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Renewable energy expansion')).toBeInTheDocument();
        expect(screen.getByText('Electric vehicle rollout')).toBeInTheDocument();
        expect(screen.getByText('Energy efficiency programs')).toBeInTheDocument();
      });
    });
  });

  describe('TC-1.6.3: Loading States', () => {
    it('shows loading skeleton when isLoading is true', () => {
      render(<ClimateTargetSidebar {...mockProps} isLoading={true} />);
      
      // Check for loading skeleton elements
      const skeletonContainer = screen.getByTestId('loading-skeleton');
      expect(skeletonContainer).toBeInTheDocument();
      expect(skeletonContainer).toHaveClass('animate-pulse');
    });

    it('shows loading skeleton during data fetch simulation', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      // Initially should show loading
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Reduction Goals')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('applies correct loading colors and styling', () => {
      render(<ClimateTargetSidebar {...mockProps} isLoading={true} />);
      
      const skeletonContainer = screen.getByTestId('loading-skeleton');
      expect(skeletonContainer).toHaveClass('bg-green-50', 'border-green-200');
    });
  });

  describe('TC-1.6.4: Error Handling', () => {
    it('displays error state when error prop is provided', () => {
      const errorMessage = 'Failed to load climate data';
      render(<ClimateTargetSidebar {...mockProps} error={errorMessage} />);
      
      expect(screen.getByText('Failed to load climate target data')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const mockOnRetry = vi.fn();
      render(<ClimateTargetSidebar {...mockProps} error="Test error" onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('calls onRetry when retry button is clicked', async () => {
      const mockOnRetry = vi.fn();
      const user = userEvent.setup();
      
      render(<ClimateTargetSidebar {...mockProps} error="Test error" onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('applies correct error styling', () => {
      render(<ClimateTargetSidebar {...mockProps} error="Test error" />);
      
      const errorContainer = screen.getByText('Failed to load climate target data').closest('div[class*="bg-red-50"]');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('TC-1.6.5: Edge Cases and Data Handling', () => {
    it('handles state name changes correctly', async () => {
      const { rerender } = render(<ClimateTargetSidebar {...mockProps} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Reduction Goals')).toBeInTheDocument();
      });
      
      // Change state name
      rerender(<ClimateTargetSidebar {...mockProps} stateName="New South Wales" />);
      
      // Should show loading again
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      
      // Wait for new data
      await waitFor(() => {
        expect(screen.getByText('Reduction Goals')).toBeInTheDocument();
      });
    });

    it('handles progress values at different ranges', async () => {
      const { rerender } = render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Current Progress')).toBeInTheDocument();
      });
      
      // Test with high progress value
      rerender(<ClimateTargetSidebar {...mockProps} stateName="Tasmania (TAS)" />);
      
      await waitFor(() => {
        expect(screen.getByText('-35%')).toBeInTheDocument();
      });
    });

    it('handles zero progress value', async () => {
      const { rerender } = render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Current Progress')).toBeInTheDocument();
      });
      
      // Test with zero progress
      rerender(<ClimateTargetSidebar {...mockProps} stateName="Northern Territory (NT)" />);
      
      await waitFor(() => {
        expect(screen.getByText('-5%')).toBeInTheDocument();
      });
    });

    it('handles missing state data gracefully', async () => {
      render(<ClimateTargetSidebar {...mockProps} stateName="Unknown State" />);
      
      // Should fallback to Victoria data
      await waitFor(() => {
        expect(screen.getByText('Reduction Goals')).toBeInTheDocument();
      });
    });
  });

  describe('TC-1.6.6: Visual Elements and Styling', () => {
    it('applies correct green theme to Reduction Goals card', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        const reductionGoalsCard = screen.getByText('Reduction Goals').closest('div[class*="bg-green-50"]');
        expect(reductionGoalsCard).toHaveClass('bg-green-50', 'border-green-200');
      });
    });

    it('applies correct blue theme to Key Initiatives card', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        const keyInitiativesCard = screen.getByText('Key Initiatives').closest('div[class*="bg-blue-50"]');
        expect(keyInitiativesCard).toHaveClass('bg-blue-50', 'border-blue-200');
      });
    });

    it('displays trophy icon in Reduction Goals header', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('🏆')).toBeInTheDocument();
      });
    });

    it('displays lightbulb icon in Key Initiatives header', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('💡')).toBeInTheDocument();
      });
    });

    it('renders progress bar with correct styling', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        const progressFill = progressBar.querySelector('div');
        expect(progressFill).toHaveClass('bg-green-500', 'rounded-full');
      });
    });

    it('shows bullet points with correct styling', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        const bulletPoints = screen.getAllByTestId('initiative-bullet');
        bulletPoints.forEach(bullet => {
          expect(bullet).toHaveClass('bg-blue-500', 'rounded-full');
        });
      });
    });
  });

  describe('TC-1.6.7: Accessibility and UX', () => {
    it('has proper heading structure', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Reduction Goals' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Key Initiatives' })).toBeInTheDocument();
      });
    });

    it('provides proper progress bar role', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('maintains proper color contrast for accessibility', async () => {
      render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        const reductionGoalsTitle = screen.getByText('Reduction Goals');
        expect(reductionGoalsTitle).toHaveClass('text-green-800');
        
        const keyInitiativesTitle = screen.getByText('Key Initiatives');
        expect(keyInitiativesTitle).toHaveClass('text-blue-800');
      });
    });
  });

  describe('TC-1.6.8: Integration and State Management', () => {
    it('updates progress display when state changes', async () => {
      const { rerender } = render(<ClimateTargetSidebar {...mockProps} />);
      
      // Initial state
      await waitFor(() => {
        expect(screen.getByText('-18%')).toBeInTheDocument();
      });
      
      // Change to different state
      rerender(<ClimateTargetSidebar {...mockProps} stateName="South Australia (SA)" />);
      
      await waitFor(() => {
        expect(screen.getByText('-22%')).toBeInTheDocument();
      });
    });

    it('maintains component state during re-renders', async () => {
      const { rerender } = render(<ClimateTargetSidebar {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Reduction Goals')).toBeInTheDocument();
      });
      
      // Re-render with same props
      rerender(<ClimateTargetSidebar {...mockProps} />);
      
      // Should still show the same content
      expect(screen.getByText('Reduction Goals')).toBeInTheDocument();
      expect(screen.getByText('Key Initiatives')).toBeInTheDocument();
    });
  });
});
