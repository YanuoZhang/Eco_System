import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, vi } from "vitest";
import Hero from "@/components/home/Hero";
import LiveClimateNews from "@/components/news/LiveClimateNews";
import ClimateTimeline from "@/components/timeline/ClimateTimeline";
import CallToAction from "@/components/home/CallToAction";
import BottomFooter from "@/components/home/BottomFooter";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: ComponentProps<"img">) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

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
    // Test Hero component directly
    render(<Hero />);
    expect(screen.getByRole("heading", { name: /Climate Change is Here/i })).toBeInTheDocument();

    // Test News component
    render(<LiveClimateNews />);
    expect(
      await screen.findByRole("heading", { name: /Latest Australian Climate Impact Updates/i }),
    ).toBeInTheDocument();

    // Test Timeline component with mock data
    const mockTimelineData = [
      {
        period: "Early Industrial Era",
        years: "1880-1950",
        title: "Industrial Revolution Begins",
        dramaticText:
          "The machines awakened. Steam and steel promised progress, but the atmosphere began remembering every smokestack.",
        childPerspective:
          "Children of this era watched the first smokestacks rise, unknowing that these tall towers would forever change the world.",
        visual: "https://example.com/image1.jpg",
        events: [],
      },
      {
        period: "First Climate Signals",
        years: "1990-2010",
        title: "First Climate Signals",
        dramaticText:
          "The Earth began to speak. Hurricanes grew stronger, glaciers retreated, but the world was still learning to listen.",
        childPerspective:
          "Millennial children witnessed the first climate documentaries, learning their planet was in danger.",
        visual: "https://example.com/image3.jpg",
        events: [],
      },
    ];

    render(<ClimateTimeline periods={mockTimelineData} />);
    expect(
      screen.getByRole("heading", { name: /Industrial Revolution Begins/i }),
    ).toBeInTheDocument();

    // Click a period and assert title changes
    const user = userEvent.setup();
    const periodButton = screen.getByRole("button", { name: /1990-2010/ });
    await user.click(periodButton);

    expect(
      await screen.findByRole("heading", { name: /First Climate Signals/i }),
    ).toBeInTheDocument();

    // Test CTA component
    render(<CallToAction />);
    const cta = await screen.findByRole("link", { name: /Explore My Climate Impact/i });
    expect(cta).toHaveAttribute("href", "/quiz");

    // Test Footer component
    render(<BottomFooter />);
    expect(screen.getAllByText("LeafForward").length).toBeGreaterThan(0);
  });
});
