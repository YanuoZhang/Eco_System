import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LiveClimateNews from "@/components/news/LiveClimateNews";
import ClimateNewsCard from "@/components/news/ClimateNewsCard";

// Mock IntersectionObserver to activate section immediately
beforeAll(() => {
  class IO implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "0px";
    readonly thresholds: ReadonlyArray<number> = [0];
    constructor(private cb: IntersectionObserverCallback) {}
    observe() {
      this.cb([{ isIntersecting: true } as unknown as IntersectionObserverEntry], this);
    }
    disconnect() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = IO as unknown as typeof IntersectionObserver;
});

describe("LiveClimateNews", () => {
  it("renders heading and loading state when in view", () => {
    render(<LiveClimateNews />);
    expect(screen.getByText(/Latest Australian Climate Impact Updates/i)).toBeInTheDocument();
    // Check for loading state since API might not be available in tests
    expect(screen.getByText(/Loading AI-curated climate insights/i)).toBeInTheDocument();
  });
});

describe("ClimateNewsCard", () => {
  it("flips to show AI insight and back with separate buttons", () => {
    render(<ClimateNewsCard headline="H1" summary="S1" label="Critical" insight="INSIGHT" />);

    // Initially should show AI Analysis button
    const aiAnalysisBtn = screen.getByRole("button", { name: /AI Analysis/i });
    expect(aiAnalysisBtn).toBeInTheDocument();

    // Click AI Analysis button to flip
    fireEvent.click(aiAnalysisBtn);
    expect(screen.getByText(/AI Insight Analysis/i)).toBeInTheDocument();
    expect(screen.getByText("INSIGHT")).toBeInTheDocument();

    // Should now show Back button
    const backBtn = screen.getByRole("button", { name: /Back/i });
    expect(backBtn).toBeInTheDocument();

    // Click Back button to return
    fireEvent.click(backBtn);
    expect(screen.getByText("S1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI Analysis/i })).toBeInTheDocument();
  });
});
