import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import QuizPage from "@/app/quiz/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/quiz",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock child quiz components to focus on page integration
vi.mock("@/components/quiz/QuizHero", () => ({
  default: ({ selectedState }: { selectedState?: string }) => (
    <div data-testid="quiz-hero">Hero {selectedState}</div>
  ),
}));
vi.mock("@/components/quiz/QuizElectricity", () => ({
  default: ({ onChange }: { onChange: (v: { electricityEmissionsKgYear: number }) => void }) => (
    <button onClick={() => onChange({ electricityEmissionsKgYear: 1000 })}>elec</button>
  ),
}));
vi.mock("@/components/quiz/QuizHotWater", () => ({
  default: ({ onChange }: { onChange: (v: { hotWaterEmissionsKgYear: number }) => void }) => (
    <button onClick={() => onChange({ hotWaterEmissionsKgYear: 500 })}>hot</button>
  ),
}));
vi.mock("@/components/quiz/QuizAppliances", () => ({ default: () => <div>appliances</div> }));
vi.mock("@/components/quiz/QuizTransport", () => ({ default: () => <div>transport</div> }));
vi.mock("@/components/quiz/QuizFloatingPreview", () => ({
  default: ({ valueKgYear, onOpen }: { valueKgYear: number; onOpen: () => void }) => (
    <div>
      <span>preview:{valueKgYear}</span>
      <button onClick={onOpen}>open</button>
    </div>
  ),
}));
vi.mock("@/components/quiz/QuizResultsModal", () => ({
  default: ({ open }: { open: boolean }) => (open ? <div role="dialog">results</div> : null),
}));

vi.mock("@/services/apiClient", () => ({
  default: {
    getStates: () =>
      Promise.resolve([
        { id: "VIC", name: "Victoria", abbreviation: "VIC", displayName: "Victoria" },
      ]),
    getEmissionsFactors: () => Promise.resolve({ electricity: 1, gas: 1, units: { gas: "MJ" } }),
  },
}));

describe("QuizPage", () => {
  it("renders quiz sections and opens results", async () => {
    render(<QuizPage />);
    // Head elements
    expect(await screen.findByTestId("quiz-hero")).toBeInTheDocument();

    // simulate emissions updates
    await act(async () => {
      screen.getByText("elec").click();
    });
    await act(async () => {
      screen.getByText("hot").click();
    });
    // preview sums (text may be split, check node textContent)
    const previewMatcher = (_: string, node: Element | null) =>
      Boolean(node && node.textContent && node.textContent.includes("preview:1500"));
    expect(screen.getAllByText(previewMatcher).length).toBeGreaterThan(0);
    // open modal
    screen.getByText("open").click();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
