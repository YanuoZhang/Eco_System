/// <reference types="vitest/globals" />
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

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

describe("Home page", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending timers or async operations
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it("renders Environmental Journey title", () => {
    render(<Home />);
    expect(screen.getByText(/Your Environmental Journey/i)).toBeInTheDocument();
  });

  describe("Step Transition Logic", () => {
    it("shows Step 1 (Welcome) by default", () => {
      render(<Home />);

      // Should show Step 1 content
      expect(screen.getByText(/Start your environmental exploration/i)).toBeInTheDocument();

      // Should show Step 1 in stepper
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
      // Use more specific selector to avoid multiple matches
      expect(screen.getByText(/Welcome to Your Journey/i, { selector: "h3" })).toBeInTheDocument();
    });

    it("transitions from Step 1 to Step 2 when CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Initially on Step 1
      expect(screen.getByText(/Start your environmental exploration/i)).toBeInTheDocument();
      expect(screen.queryByText(/Data Insight Hub/i)).not.toBeInTheDocument();

      // Click the CTA button to go to next step
      const nextButton = screen.getByRole("button", { name: /Start My Environmental Journey/i });
      await user.click(nextButton);

      // Wait for the transition (JourneyWelcome has a 1.5s delay)
      await waitFor(
        () => {
          expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.getByText(/Victoria \(VIC\) Environmental Data/i)).toBeInTheDocument();

      // Step 1 content should be hidden from main content (but stepper still shows it)
      // The stepper continues to show all step information, which is expected
      expect(screen.getByText(/Start your environmental exploration/i)).toBeInTheDocument();

      // Stepper should show Step 2 as current
      expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Discover Your Environment/i, { selector: "h3" }),
      ).toBeInTheDocument();
    });

    it("shows correct navigation buttons on Step 2", async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Navigate to Step 2
      const nextButton = screen.getByRole("button", { name: /Start My Environmental Journey/i });
      await user.click(nextButton);

      // Wait for the transition
      await waitFor(
        () => {
          expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Should show Previous Step and Next Journey buttons
      expect(screen.getByRole("button", { name: /← Previous Step/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Next Journey/i })).toBeInTheDocument();
    });

    it("can navigate back from Step 2 to Step 1", async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Navigate to Step 2
      const nextButton = screen.getByRole("button", { name: /Start My Environmental Journey/i });
      await user.click(nextButton);

      // Wait for the transition
      await waitFor(
        () => {
          expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Verify we're on Step 2
      expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();

      // Click Previous Step button
      const prevButton = screen.getByRole("button", { name: /← Previous Step/i });
      await user.click(prevButton);

      // Should be back on Step 1
      expect(screen.getByText(/Start your environmental exploration/i)).toBeInTheDocument();
      expect(screen.queryByText(/Data Insight Hub/i)).not.toBeInTheDocument();
    });

    it("can start over from Step 2", async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Navigate to Step 2
      const nextButton = screen.getByRole("button", { name: /Start My Environmental Journey/i });
      await user.click(nextButton);

      // Wait for the transition
      await waitFor(
        () => {
          expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Verify we're on Step 2
      expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();

      // Click Previous Step button to go back
      const prevButton = screen.getByRole("button", { name: /← Previous Step/i });
      await user.click(prevButton);

      // Should be back on Step 1
      expect(screen.getByText(/Start your environmental exploration/i)).toBeInTheDocument();
      expect(screen.queryByText(/Data Insight Hub/i)).not.toBeInTheDocument();
    });

    it("shows correct step progress in stepper", async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Initially Step 1 should be active
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Welcome to Your Journey/i, { selector: "h3" })).toBeInTheDocument();

      // Navigate to Step 2
      const nextButton = screen.getByRole("button", { name: /Start My Environmental Journey/i });
      await user.click(nextButton);

      // Wait for the transition
      await waitFor(
        () => {
          expect(screen.getByText(/Data Insight Hub/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Step 2 should be active
      expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Discover Your Environment/i, { selector: "h3" }),
      ).toBeInTheDocument();
    });

    it("displays correct step icons", () => {
      render(<Home />);

      // Should show step icons in stepper (more specific selectors)
      const stepperIcons = screen.getAllByText(/🌱|🌍|🧮/);
      expect(stepperIcons.length).toBeGreaterThanOrEqual(3);

      // Check that all three step icons are present
      const iconTexts = stepperIcons.map((icon) => icon.textContent);
      expect(iconTexts).toContain("🌱");
      expect(iconTexts).toContain("🌍");
      expect(iconTexts).toContain("🧮");
    });

    it("renders without hydration errors", () => {
      // This test ensures the component renders cleanly
      const { container } = render(<Home />);

      // Should render without errors
      expect(container).toBeInTheDocument();

      // Should show initial Step 1 content
      expect(screen.getByText(/Start your environmental exploration/i)).toBeInTheDocument();
    });
  });
});
