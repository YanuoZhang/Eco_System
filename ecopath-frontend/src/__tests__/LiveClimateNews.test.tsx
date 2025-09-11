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
  it("renders heading and cards when in view", () => {
    render(<LiveClimateNews />);
    expect(screen.getByText(/Latest Australian Climate Impact Updates/i)).toBeInTheDocument();
    // One of mocked headlines (can appear on both sides of the flip)
    const reef = screen.getAllByText(/Great Barrier Reef Records Fifth Mass Bleaching Event/i);
    expect(reef.length).toBeGreaterThan(0);
  });
});

describe("ClimateNewsCard", () => {
  it("flips to show AI insight and back", () => {
    render(<ClimateNewsCard headline="H1" summary="S1" label="Critical" insight="INSIGHT" />);
    // front has summary text
    expect(screen.getByText("S1")).toBeInTheDocument();
    // click to flip
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/AI Insight Analysis/i)).toBeInTheDocument();
    expect(screen.getByText("INSIGHT")).toBeInTheDocument();
    // click to return
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("S1")).toBeInTheDocument();
  });
});
