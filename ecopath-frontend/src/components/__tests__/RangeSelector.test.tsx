/// <reference types="vitest/globals" />
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RangeSelector, { TimeRange } from "../RangeSelector";

// Mock data for testing
const mockRanges: TimeRange[] = [
  { label: "5 Years", value: 5 },
  { label: "10 Years", value: 10 },
  { label: "All Data", value: 0 },
];

const mockOnRangeChange = vi.fn();

describe("RangeSelector", () => {
  beforeEach(() => {
    mockOnRangeChange.mockClear();
  });

  describe("TC-1.5.1: Component Rendering", () => {
    it("renders with default props", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      expect(screen.getByText("Time Range:")).toBeInTheDocument();
      expect(screen.getByText("10 Years")).toBeInTheDocument();
    });

    it("renders with custom label", () => {
      render(
        <RangeSelector
          ranges={mockRanges}
          selectedValue={10}
          onRangeChange={mockOnRangeChange}
          label="Custom Label"
        />,
      );

      expect(screen.getByText("Custom Label")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(
        <RangeSelector
          ranges={mockRanges}
          selectedValue={10}
          onRangeChange={mockOnRangeChange}
          className="custom-class"
        />,
      );

      const container = screen.getByText("Time Range:").closest(".relative");
      expect(container).toHaveClass("custom-class");
    });

    it("displays selected range correctly", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={5} onRangeChange={mockOnRangeChange} />,
      );

      expect(screen.getByText("5 Years")).toBeInTheDocument();
    });

    it("shows fallback text when selected value not found", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={999} onRangeChange={mockOnRangeChange} />,
      );

      expect(screen.getByText("Select range")).toBeInTheDocument();
    });
  });

  describe("TC-1.5.2: Dropdown Functionality", () => {
    it("opens dropdown when clicked", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button", { expanded: false });
      await user.click(button);

      expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
      expect(screen.getByText("5 Years")).toBeInTheDocument();
      expect(screen.getByText("All Data")).toBeInTheDocument();
    });

    it("toggles dropdown when button is clicked again", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");

      // First click - open dropdown
      await user.click(button);
      expect(screen.getByText("5 Years")).toBeInTheDocument();

      // Second click - close dropdown
      await user.click(button);
      expect(screen.queryByText("5 Years")).not.toBeInTheDocument();
    });
  });

  describe("TC-1.5.3: Range Selection", () => {
    it("calls onRangeChange when a range is selected", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      const fiveYearOption = screen.getByText("5 Years");
      await user.click(fiveYearOption);

      expect(mockOnRangeChange).toHaveBeenCalledWith(5);
    });

    it("closes dropdown after selection", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      const fiveYearOption = screen.getByText("5 Years");
      await user.click(fiveYearOption);

      // Dropdown should be closed
      expect(screen.queryByText("5 Years")).not.toBeInTheDocument();
    });

    it("highlights selected range in dropdown", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      // Find the dropdown option button (not the main button)
      const dropdownOptions = screen.getAllByRole("button");
      const selectedOption = dropdownOptions.find(
        (btn) => btn.textContent === "10 Years" && btn !== button,
      );

      expect(selectedOption).toHaveClass("bg-green-100", "text-green-900");
    });

    it("handles all data selection correctly", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      const allDataOption = screen.getByText("All Data");
      await user.click(allDataOption);

      expect(mockOnRangeChange).toHaveBeenCalledWith(0);
    });
  });

  describe("TC-1.5.4: Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-haspopup", "listbox");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("updates ARIA expanded state when dropdown opens", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("has proper focus states", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-green-500");
    });

    it("maintains proper button role", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1); // Main button only when closed
    });
  });

  describe("TC-1.5.5: Styling and Visual Feedback", () => {
    it("applies proper styling classes", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "w-full",
        "px-3",
        "py-2",
        "text-left",
        "bg-white",
        "border",
        "border-gray-300",
        "rounded-md",
        "shadow-sm",
      );
    });

    it("shows hover effects", () => {
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-gray-50", "transition-colors");
    });

    it("displays dropdown with proper styling", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      const dropdown = screen.getByText("5 Years").closest(".absolute");
      expect(dropdown).toHaveClass(
        "absolute",
        "z-10",
        "w-full",
        "mt-1",
        "bg-white",
        "border",
        "border-gray-300",
        "rounded-md",
        "shadow-lg",
      );
    });

    it("highlights hovered options", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      const fiveYearOption = screen.getByText("5 Years").closest("button");
      expect(fiveYearOption).toHaveClass(
        "hover:bg-green-50",
        "hover:text-green-900",
        "transition-colors",
      );
    });
  });

  describe("TC-1.5.6: Edge Cases", () => {
    it("handles empty ranges array", () => {
      render(<RangeSelector ranges={[]} selectedValue={10} onRangeChange={mockOnRangeChange} />);

      expect(screen.getByText("Select range")).toBeInTheDocument();
    });

    it("handles single range option", () => {
      const singleRange = [{ label: "Only Option", value: 1 }];
      render(
        <RangeSelector ranges={singleRange} selectedValue={1} onRangeChange={mockOnRangeChange} />,
      );

      expect(screen.getByText("Only Option")).toBeInTheDocument();
    });

    it("handles very long range labels", () => {
      const longLabelRanges = [
        { label: "This is a very long range label that might overflow the container", value: 1 },
      ];
      render(
        <RangeSelector
          ranges={longLabelRanges}
          selectedValue={1}
          onRangeChange={mockOnRangeChange}
        />,
      );

      expect(
        screen.getByText("This is a very long range label that might overflow the container"),
      ).toBeInTheDocument();
    });

    it("handles zero value ranges", () => {
      const zeroValueRanges = [
        { label: "Zero Value", value: 0 },
        { label: "Positive Value", value: 1 },
      ];
      render(
        <RangeSelector
          ranges={zeroValueRanges}
          selectedValue={0}
          onRangeChange={mockOnRangeChange}
        />,
      );

      expect(screen.getByText("Zero Value")).toBeInTheDocument();
    });
  });

  describe("TC-1.5.7: Integration and State Management", () => {
    it("maintains selected state after dropdown interactions", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");

      // Open and close dropdown without changing selection
      await user.click(button);
      await user.click(button);

      // Should still show the same selected value
      expect(screen.getByText("10 Years")).toBeInTheDocument();
    });

    it("calls onRangeChange with correct values for all options", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");

      // Test all options
      await user.click(button);
      await user.click(screen.getByText("5 Years"));
      expect(mockOnRangeChange).toHaveBeenCalledWith(5);

      await user.click(button);
      await user.click(screen.getByText("All Data"));
      expect(mockOnRangeChange).toHaveBeenCalledWith(0);

      await user.click(button);
      // Use getAllByText to get the dropdown option specifically
      const dropdownOptions = screen.getAllByText("10 Years");
      const dropdownOption = dropdownOptions.find(
        (option) => option.closest("button") && option.closest("button") !== button,
      );
      if (dropdownOption) {
        await user.click(dropdownOption);
        expect(mockOnRangeChange).toHaveBeenCalledWith(10);
      }
    });

    it("handles rapid clicks correctly", async () => {
      const user = userEvent.setup();
      render(
        <RangeSelector ranges={mockRanges} selectedValue={10} onRangeChange={mockOnRangeChange} />,
      );

      const button = screen.getByRole("button");

      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should be in a consistent state - check if component still renders
      expect(screen.getByText("Time Range:")).toBeInTheDocument();
    });
  });
});
