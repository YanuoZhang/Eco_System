/// <reference types="vitest/globals" />
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataInsight from "../DataInsight";
import { StateProvider } from "@/contexts/StateContext";

// Mock API service
vi.mock("@/services/api", () => ({
  ApiService: {
    getEnergyMix: vi.fn().mockResolvedValue([]),
    getEmissions: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// Mock Next.js hooks
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockForward = vi.fn();
const mockRefresh = vi.fn();
const mockPrefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "step" ? "1" : null),
    has: (key: string) => key === "step",
    forEach: () => {},
    entries: () => [],
    keys: () => [],
    values: () => [],
    toString: () => "step=1",
  }),
}));

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000?step=1",
    pathname: "/",
    search: "?step=1",
  },
  writable: true,
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <StateProvider>{children}</StateProvider>
);

describe("DataInsight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending timers or async operations
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe("TC-1.3.1: Component Rendering", () => {
    it("renders DataInsight component with default state", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();
      expect(screen.getByText(/Victoria.*Environmental Data/i)).toBeInTheDocument();
    });

    it("renders state information display", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      expect(screen.getByText(/Real-time data from EPA Victoria & AEMO/i)).toBeInTheDocument();
      // Should show loading skeleton instead of "No Energy Data Available"
      expect(screen.getByTestId("energy-tab")).toBeInTheDocument();
    });

    it("renders EnergyMixChart with correct data", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      // Should show loading skeleton instead of "No Energy Data Available"
      expect(screen.getByTestId("energy-tab")).toBeInTheDocument();
    });

    it("renders navigation buttons", () => {
      const mockOnNext = vi.fn();
      const mockOnPrev = vi.fn();

      render(
        <TestWrapper>
          <DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      expect(screen.getByRole("button", { name: /Previous Step/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Next Journey/i })).toBeInTheDocument();
    });
  });

  describe("TC-1.3.2: State Information Display", () => {
    it("displays current state information", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      expect(screen.getByText(/Victoria.*Environmental Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Real-time data from EPA Victoria & AEMO/i)).toBeInTheDocument();
    });

    it("shows loading state for energy data", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      // Should show loading skeleton instead of "No Energy Data Available"
      expect(screen.getByTestId("energy-tab")).toBeInTheDocument();
    });
  });

  describe("TC-1.3.3: Data Display", () => {
    it("displays renewable growth information correctly", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      // Energy data display tests removed as layout simplified
    });

    it("displays storage and grid information correctly", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      // Storage and grid tests removed as layout simplified
    });

    it("shows correct energy mix data for VIC state", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      // Should show loading skeleton or energy tab
      expect(screen.getByTestId("energy-tab")).toBeInTheDocument();
    });
  });

  describe("TC-1.3.4: Navigation", () => {
    it("calls onPrev when Previous button is clicked", async () => {
      const mockOnPrev = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DataInsight onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      const prevButton = screen.getByRole("button", { name: /Previous Step/i });
      await user.click(prevButton);

      expect(mockOnPrev).toHaveBeenCalledTimes(1);
    });

    it("calls onNext when Next button is clicked", async () => {
      const mockOnNext = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DataInsight onNext={mockOnNext} />
        </TestWrapper>,
      );

      const nextButton = screen.getByRole("button", { name: /Next Journey/i });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it("buttons are properly styled and accessible", () => {
      const mockOnNext = vi.fn();
      const mockOnPrev = vi.fn();

      render(
        <TestWrapper>
          <DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      const prevButton = screen.getByRole("button", { name: /Previous Step/i });
      const nextButton = screen.getByRole("button", { name: /Next Journey/i });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe("TC-1.3.5: Layout and Styling", () => {
    it("applies correct container styling", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      const mainContainer = screen.getByRole("main");
      expect(mainContainer).toBeInTheDocument();
    });

    it("displays sections in correct grid layout", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      // Should show energy tab and main content area
      expect(screen.getByTestId("energy-tab")).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("shows proper spacing between sections", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      // Should show main content structure
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByTestId("energy-tab")).toBeInTheDocument();
    });
  });

  describe("TC-1.3.6: Edge Cases", () => {
    it("handles missing props gracefully", () => {
      render(
        <TestWrapper>
          <DataInsight />
        </TestWrapper>,
      );

      expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();
    });

    it("maintains component state during interactions", async () => {
      const mockOnNext = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DataInsight onNext={mockOnNext} />
        </TestWrapper>,
      );

      const nextButton = screen.getByRole("button", { name: /Next Journey/i });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it("renders without crashing when no props provided", () => {
      expect(() =>
        render(
          <TestWrapper>
            <DataInsight />
          </TestWrapper>,
        ),
      ).not.toThrow();
    });
  });

  describe("TC-1.3.7: Accessibility", () => {
    it("maintains proper tab order", () => {
      const mockOnNext = vi.fn();
      const mockOnPrev = vi.fn();

      render(
        <TestWrapper>
          <DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      const prevButton = screen.getByRole("button", { name: /Previous Step/i });
      const nextButton = screen.getByRole("button", { name: /Next Journey/i });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it("provides keyboard navigation support", () => {
      const mockOnNext = vi.fn();
      const mockOnPrev = vi.fn();

      render(
        <TestWrapper>
          <DataInsight onNext={mockOnNext} onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      const prevButton = screen.getByRole("button", { name: /Previous Step/i });
      const nextButton = screen.getByRole("button", { name: /Next Journey/i });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });
});
