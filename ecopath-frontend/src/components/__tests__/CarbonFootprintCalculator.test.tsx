/// <reference types="vitest/globals" />

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CarbonFootprintCalculator from "../CarbonFootprintCalculator";

describe("CarbonFootprintCalculator", () => {
  it("renders the calculator with transportation timeframe selector", () => {
    render(<CarbonFootprintCalculator />);

    expect(screen.getByText("Carbon Footprint Calculator")).toBeInTheDocument();
    expect(screen.getByText("Transportation")).toBeInTheDocument();

    // Check for transport timeframe buttons
    expect(screen.getByTestId("time-unit-day")).toBeInTheDocument();
    expect(
      screen
        .getByTestId("transport-time-unit-select")
        .querySelector('[data-testid="time-unit-month"]'),
    ).toBeInTheDocument();
    expect(
      screen
        .getByTestId("transport-time-unit-select")
        .querySelector('[data-testid="time-unit-quarter"]'),
    ).toBeInTheDocument();
  });

  it("allows selecting different transport timeframes", () => {
    render(<CarbonFootprintCalculator />);

    const monthButton = screen
      .getByTestId("transport-time-unit-select")
      .querySelector('[data-testid="time-unit-month"]');
    fireEvent.click(monthButton!);

    expect(monthButton).toHaveClass("bg-green-500", "text-white");
  });

  it("updates distance label based on selected timeframe", () => {
    render(<CarbonFootprintCalculator />);

    // Check initial daily label
    expect(screen.getByText("Distance (km) - Daily")).toBeInTheDocument();

    // Click month
    const monthButton = screen
      .getByTestId("transport-time-unit-select")
      .querySelector('[data-testid="time-unit-month"]');
    fireEvent.click(monthButton!);

    // Check updated label
    expect(screen.getByText("Distance (km) - Monthly")).toBeInTheDocument();
  });

  it("shows appropriate help text for different timeframes", () => {
    render(<CarbonFootprintCalculator />);

    // Check initial daily help text
    expect(screen.getByText("Round trip distance")).toBeInTheDocument();

    // Click month
    const monthButton = screen
      .getByTestId("transport-time-unit-select")
      .querySelector('[data-testid="time-unit-month"]');
    fireEvent.click(monthButton!);

    // Check updated help text
    expect(screen.getByText("Total monthly distance")).toBeInTheDocument();
  });

  it("renders transport mode selector", () => {
    render(<CarbonFootprintCalculator />);

    expect(screen.getByTestId("transport-mode-select")).toBeInTheDocument();
    expect(screen.getByText("Select transport method...")).toBeInTheDocument();
  });

  it("renders distance input", () => {
    render(<CarbonFootprintCalculator />);

    expect(screen.getByTestId("distance-input")).toBeInTheDocument();
  });
});
