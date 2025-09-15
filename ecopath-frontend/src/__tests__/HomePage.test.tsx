import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import Home from "@/app/page";

// Auto-activate IntersectionObserver for news section
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

describe("Home page composition", () => {
  it("renders hero, news, timeline, CTA and footer; supports timeline switch and news flip", async () => {
    render(<Home />);
    // Hero headline
    expect(screen.getByRole("heading", { name: /Climate Change is Here/i })).toBeInTheDocument();
    // News heading
    expect(
      screen.getByRole("heading", { name: /Latest Australian Climate Impact Updates/i }),
    ).toBeInTheDocument();
    // Timeline exists and default first step title visible
    expect(
      screen.getByRole("heading", { name: /Industrial Revolution Begins/i }),
    ).toBeInTheDocument();
    // Click a period and assert title changes
    screen.getByRole("button", { name: /1990-2010/ }).click();
    expect(
      await screen.findByRole("heading", { name: /First Climate Signals/i }),
    ).toBeInTheDocument();
    // Flip one news card (pick specific card caption to avoid multiple matches)
    const anyFlipButtons = Array.from(document.querySelectorAll("button")) as HTMLButtonElement[];
    anyFlipButtons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    // use getAllByText to tolerate multiple flipped cards
    expect((await screen.findAllByText(/AI Insight Analysis/i)).length).toBeGreaterThan(0);

    // CTA link
    const cta = screen.getByRole("link", { name: /Explore My Climate Impact/i });
    expect(cta).toHaveAttribute("href", "/quiz");
    // Footer brand
    expect(screen.getAllByText("EcoPath").length).toBeGreaterThan(0);
  });
});
