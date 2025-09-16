import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClimateTimeline from "@/components/timeline/ClimateTimeline";

// Mock timeline data
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
    period: "The Great Acceleration",
    years: "1950-1990",
    title: "The Great Acceleration",
    dramaticText:
      "We built a world of abundance, not knowing we were writing stories of scarcity for our children.",
    childPerspective:
      "Baby boomers grew up believing progress meant prosperity, while their children would inherit a warming world.",
    visual: "https://example.com/image2.jpg",
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
  {
    period: "Climate Crisis Arrives",
    years: "2010-2020",
    title: "Climate Crisis Arrives",
    dramaticText:
      "The future knocked on our door through smoke and flames. A generation stood up, refusing to inherit a broken world.",
    childPerspective:
      "Gen Z children led school strikes, demanding adults act on climate change before it was too late.",
    visual: "https://example.com/image4.jpg",
    events: [],
  },
  {
    period: "The Crossroads Moment",
    years: "2020-2030",
    title: "The Crossroads Moment",
    dramaticText:
      "This is our moment. The story of what happens next is still being written - through every choice we make today.",
    childPerspective:
      "Today's children will live the consequences of our choices. Their future depends on the actions we take now.",
    visual: "https://example.com/image5.jpg",
    events: [],
  },
];

describe("ClimateTimeline", () => {
  it("renders heading and period nav", () => {
    render(<ClimateTimeline periods={mockTimelineData} />);
    expect(screen.getByRole("heading", { name: /How We Got Here/i })).toBeInTheDocument();
    // first and last period tags exist (may appear twice: badge and nav button)
    expect(screen.getAllByText("1880-1950").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2020-2030").length).toBeGreaterThan(0);
  });

  it("changes active step when clicking a period", () => {
    render(<ClimateTimeline periods={mockTimelineData} />);
    // default active title should be the first step
    expect(
      screen.getByRole("heading", { name: /Industrial Revolution Begins/i }),
    ).toBeInTheDocument();

    const targetBtn = screen.getByRole("button", { name: /1990-2010/ });
    fireEvent.click(targetBtn);

    // after click, card title should update
    expect(screen.getByRole("heading", { name: /First Climate Signals/i })).toBeInTheDocument();
  });

  it("navigates with Prev/Next and updates dots", () => {
    render(<ClimateTimeline periods={mockTimelineData} />);
    const next = screen.getByRole("button", { name: /Next/i });
    const prev = screen.getByRole("button", { name: /Prev/i });

    // initial: prev disabled
    expect(prev).toBeDisabled();

    // go next twice
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: /First Climate Signals/i })).toBeInTheDocument();

    // dots: one active dot should have scale-125 class; approximate by querying buttons and checking one matches
    const dotButtons = document.querySelectorAll("button");
    const hasActiveDot = Array.from(dotButtons).some((b) => /scale-125/.test(b.className));
    expect(hasActiveDot).toBe(true);

    // go prev once
    fireEvent.click(prev);
    expect(screen.getByRole("heading", { name: /The Great Acceleration/i })).toBeInTheDocument();
  });
});
