import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EquivalentsPanel from "../EquivalentsPanel";

describe("EquivalentsPanel", () => {
  it("renders with correct equivalents for given emissions", () => {
    const totalEmissionsKg = 1000; // 1 tonne = 1000kg
    const timeUnit = "month";

    render(<EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit={timeUnit} />);

    // Check if all equivalents are displayed with correct values
    expect(screen.getByTestId("equiv-trees")).toBeInTheDocument();
    expect(screen.getByTestId("equiv-phones")).toBeInTheDocument();
    expect(screen.getByTestId("equiv-km")).toBeInTheDocument();
    expect(screen.getByTestId("equiv-burgers")).toBeInTheDocument();
    expect(screen.getByTestId("equiv-milk")).toBeInTheDocument();

    // Check specific calculations
    // Trees: 1000 / 21.77 = 45.93... ≈ 46
    expect(screen.getByText("46")).toBeInTheDocument();
    expect(screen.getByText("trees")).toBeInTheDocument();

    // Phone charges: 1000 * 1215 = 1,215,000
    expect(screen.getByText("1,215,000")).toBeInTheDocument();
    expect(screen.getByText("charges")).toBeInTheDocument();

    // Petrol car km: 1000 / 0.192 = 5208.33... ≈ 5208
    expect(screen.getByText("5,208")).toBeInTheDocument();
    expect(screen.getByText("km")).toBeInTheDocument();

    // Beef burgers: 1000 / 5 = 200
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("burgers")).toBeInTheDocument();

    // Cups of milk: 1000 / 0.5 = 2000
    expect(screen.getByText("2,000")).toBeInTheDocument();
    expect(screen.getByText("cups")).toBeInTheDocument();
  });

  it("displays correct time unit label", () => {
    const totalEmissionsKg = 500;
    const timeUnit = "day";

    render(<EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit={timeUnit} />);

    expect(screen.getByText("Your daily CO₂ emissions equivalent to:")).toBeInTheDocument();
  });

  it("shows fallback message when emissions are zero or negative", () => {
    render(<EquivalentsPanel totalEmissionsKg={0} timeUnit="month" />);

    expect(screen.getByText("No equivalents available.")).toBeInTheDocument();
    expect(
      screen.getByText("Calculate your emissions to see everyday equivalents."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("equiv-trees")).not.toBeInTheDocument();
  });

  it("toggles panel visibility when toggle button is clicked", () => {
    const totalEmissionsKg = 1000;
    const timeUnit = "month";

    render(<EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit={timeUnit} />);

    // Initially visible
    expect(screen.getByTestId("equiv-trees")).toBeInTheDocument();
    expect(screen.getByTestId("equivalents-toggle")).toHaveTextContent("Hide");

    // Click to hide
    fireEvent.click(screen.getByTestId("equivalents-toggle"));
    expect(screen.queryByTestId("equiv-trees")).not.toBeInTheDocument();
    expect(screen.getByTestId("equivalents-toggle")).toHaveTextContent("Show");

    // Click to show again
    fireEvent.click(screen.getByTestId("equivalents-toggle"));
    expect(screen.getByTestId("equiv-trees")).toBeInTheDocument();
    expect(screen.getByTestId("equivalents-toggle")).toHaveTextContent("Hide");
  });

  it("formats large numbers with commas correctly", () => {
    const totalEmissionsKg = 10000; // Large number to test formatting
    const timeUnit = "year";

    render(<EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit={timeUnit} />);

    // Phone charges: 10000 * 1215 = 12,150,000
    expect(screen.getByText("12,150,000")).toBeInTheDocument();
  });

  it("displays correct icons and labels for each equivalent", () => {
    const totalEmissionsKg = 100;
    const timeUnit = "week";

    render(<EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit={timeUnit} />);

    // Check icons and labels are present
    expect(screen.getByText("🌳")).toBeInTheDocument();
    expect(screen.getByText("Trees needed to absorb")).toBeInTheDocument();

    expect(screen.getByText("🔋")).toBeInTheDocument();
    expect(screen.getByText("Phone charges")).toBeInTheDocument();

    expect(screen.getByText("🚗")).toBeInTheDocument();
    expect(screen.getByText("Petrol car kilometers")).toBeInTheDocument();

    expect(screen.getByText("🍔")).toBeInTheDocument();
    expect(screen.getByText("Beef burgers")).toBeInTheDocument();

    expect(screen.getByText("🥛")).toBeInTheDocument();
    expect(screen.getByText("Cups of milk")).toBeInTheDocument();
  });

  it("updates values when timeUnit changes", () => {
    const totalEmissionsKg = 1000;
    const { rerender } = render(
      <EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit="day" />,
    );

    expect(screen.getByText("Your daily CO₂ emissions equivalent to:")).toBeInTheDocument();

    // Change time unit
    rerender(<EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit="year" />);

    expect(screen.getByText("Your yearly CO₂ emissions equivalent to:")).toBeInTheDocument();
  });

  it("handles different time unit values correctly", () => {
    const totalEmissionsKg = 500;
    const timeUnits = ["day", "week", "month", "quarter", "year"];

    timeUnits.forEach((timeUnit) => {
      const { unmount } = render(
        <EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit={timeUnit} />,
      );

      const expectedLabels = {
        day: "daily",
        week: "weekly",
        month: "monthly",
        quarter: "quarterly",
        year: "yearly",
      };

      expect(
        screen.getByText(
          `Your ${expectedLabels[timeUnit as keyof typeof expectedLabels]} CO₂ emissions equivalent to:`,
        ),
      ).toBeInTheDocument();

      unmount();
    });
  });

  it("displays note about approximate values", () => {
    const totalEmissionsKg = 1000;
    const timeUnit = "month";

    render(<EquivalentsPanel totalEmissionsKg={totalEmissionsKg} timeUnit={timeUnit} />);

    expect(
      screen.getByText(/These equivalents are approximate and based on average values/),
    ).toBeInTheDocument();
  });
});
