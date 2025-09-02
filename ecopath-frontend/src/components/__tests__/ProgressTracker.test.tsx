/// <reference types="vitest/globals" />
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProgressTracker from "../ProgressTracker";
import { StateProvider } from "@/contexts/StateContext";

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
    get: (key: string) => (key === "step" ? "4" : null),
    has: (key: string) => key === "step",
    forEach: () => {},
    entries: () => [],
    keys: () => [],
    values: () => [],
    toString: () => "step=4",
  }),
}));

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000?step=4",
    pathname: "/",
    search: "?step=4",
  },
  writable: true,
});

// Mock ResizeObserver for recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <StateProvider>{children}</StateProvider>
);

describe("ProgressTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up any pending timers or async operations
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe("TC-2.5.1: Route to next step (Tracking)", () => {
    it("renders ProgressTracker component with correct title", () => {
      render(
        <TestWrapper>
          <ProgressTracker />
        </TestWrapper>,
      );

      expect(screen.getByRole("heading", { name: /Progress Tracking/i })).toBeInTheDocument();
      expect(screen.getByText(/Monitor your environmental progress/i)).toBeInTheDocument();
    });

    it("displays coming soon message", () => {
      render(
        <TestWrapper>
          <ProgressTracker />
        </TestWrapper>,
      );

      expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /We're working hard to bring you an amazing progress tracking experience/i,
        ),
      ).toBeInTheDocument();
    });

    it("shows navigation buttons when props are provided", () => {
      const mockOnNext = vi.fn();
      const mockOnPrev = vi.fn();

      render(
        <TestWrapper>
          <ProgressTracker onNext={mockOnNext} onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      expect(screen.getByRole("button", { name: /Previous Step/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Next Journey/i })).toBeInTheDocument();
    });

    it("calls onNext when Next Journey button is clicked", async () => {
      const mockOnNext = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProgressTracker onNext={mockOnNext} />
        </TestWrapper>,
      );

      const nextButton = screen.getByRole("button", { name: /Next Journey/i });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it("calls onPrev when Previous Step button is clicked", async () => {
      const mockOnPrev = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProgressTracker onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      const prevButton = screen.getByRole("button", { name: /Previous Step/i });
      await user.click(prevButton);

      expect(mockOnPrev).toHaveBeenCalledTimes(1);
    });

    it("displays expected launch date", () => {
      render(
        <TestWrapper>
          <ProgressTracker />
        </TestWrapper>,
      );

      expect(screen.getByText(/Expected launch: Q2 2024/i)).toBeInTheDocument();
    });

    it("displays feature preview cards", () => {
      render(
        <TestWrapper>
          <ProgressTracker />
        </TestWrapper>,
      );

      expect(screen.getByText(/Progress Charts/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Goal Setting/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Achievements/i })).toBeInTheDocument();
    });

    it("shows construction icon and coming soon styling", () => {
      render(
        <TestWrapper>
          <ProgressTracker />
        </TestWrapper>,
      );

      // Check for the construction emoji
      expect(screen.getByText("🚧")).toBeInTheDocument();
      // Check for the coming soon title
      expect(screen.getByRole("heading", { name: /Coming Soon/i })).toBeInTheDocument();
    });

    it("renders without crashing when no props provided", () => {
      expect(() =>
        render(
          <TestWrapper>
            <ProgressTracker />
          </TestWrapper>,
        ),
      ).not.toThrow();
    });

    it("maintains proper accessibility", () => {
      const mockOnNext = vi.fn();
      const mockOnPrev = vi.fn();

      render(
        <TestWrapper>
          <ProgressTracker onNext={mockOnNext} onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      const prevButton = screen.getByRole("button", { name: /Previous Step/i });
      const nextButton = screen.getByRole("button", { name: /Next Journey/i });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe("US 2.5: Navigate to Next Step", () => {
    it("allows navigation from Data Insight to Tracking page", () => {
      const mockOnNext = vi.fn();

      render(
        <TestWrapper>
          <ProgressTracker onNext={mockOnNext} />
        </TestWrapper>,
      );

      // Verify we're on the Tracking page
      expect(screen.getByRole("heading", { name: /Progress Tracking/i })).toBeInTheDocument();
      expect(screen.getByTestId("progress-tracker")).toBeInTheDocument();
    });

    it("displays tracking-specific content and features", () => {
      render(
        <TestWrapper>
          <ProgressTracker />
        </TestWrapper>,
      );

      // Check for tracking-specific features
      expect(screen.getByText(/Monthly progress tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/Goal setting and monitoring/i)).toBeInTheDocument();
      expect(screen.getByText(/Personalized improvement suggestions/i)).toBeInTheDocument();
    });

    it("provides proper navigation flow from Calculator to Tracking", () => {
      const mockOnPrev = vi.fn();

      render(
        <TestWrapper>
          <ProgressTracker onPrev={mockOnPrev} />
        </TestWrapper>,
      );

      // Verify previous button allows going back to Calculator
      const prevButton = screen.getByRole("button", { name: /Previous Step/i });
      expect(prevButton).toBeInTheDocument();
    });
  });
});
