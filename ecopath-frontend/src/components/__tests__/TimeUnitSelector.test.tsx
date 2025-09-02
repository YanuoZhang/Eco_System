import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TimeUnitSelector from "../TimeUnitSelector";

describe("TimeUnitSelector", () => {
  const mockOnUnitChange = vi.fn();

  beforeEach(() => {
    mockOnUnitChange.mockClear();
  });

  it("renders all time unit options", () => {
    render(<TimeUnitSelector selectedUnit="month" onUnitChange={mockOnUnitChange} />);

    expect(screen.getByTestId("time-unit-day")).toBeInTheDocument();
    expect(screen.getByTestId("time-unit-week")).toBeInTheDocument();
    expect(screen.getByTestId("time-unit-month")).toBeInTheDocument();
    expect(screen.getByTestId("time-unit-quarter")).toBeInTheDocument();
  });

  it("shows correct labels for each time unit", () => {
    render(<TimeUnitSelector selectedUnit="month" onUnitChange={mockOnUnitChange} />);

    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Month")).toBeInTheDocument();
    expect(screen.getByText("Quarter")).toBeInTheDocument();
  });

  it("highlights the selected unit", () => {
    render(<TimeUnitSelector selectedUnit="week" onUnitChange={mockOnUnitChange} />);

    const weekButton = screen.getByTestId("time-unit-week");
    expect(weekButton).toHaveClass("bg-green-500", "text-white");
  });

  it("calls onUnitChange when a different unit is clicked", () => {
    render(<TimeUnitSelector selectedUnit="month" onUnitChange={mockOnUnitChange} />);

    const dayButton = screen.getByTestId("time-unit-day");
    fireEvent.click(dayButton);

    expect(mockOnUnitChange).toHaveBeenCalledWith("day");
  });

  it("applies custom className when provided", () => {
    const customClass = "custom-class";
    render(
      <TimeUnitSelector
        selectedUnit="month"
        onUnitChange={mockOnUnitChange}
        className={customClass}
      />,
    );

    const container = screen.getByTestId("time-unit-select");
    expect(container).toHaveClass(customClass);
  });

  it("uses custom data-testid when provided", () => {
    const customTestId = "custom-time-selector";
    render(
      <TimeUnitSelector
        selectedUnit="month"
        onUnitChange={mockOnUnitChange}
        dataTestId={customTestId}
      />,
    );

    expect(screen.getByTestId(customTestId)).toBeInTheDocument();
  });
});
