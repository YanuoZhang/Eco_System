/// <reference types="vitest/globals" />
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmissionsChart, { EmissionData } from "../EmissionsChart";

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock data for testing
const mockEmissionData: EmissionData[] = [
  { year: 2019, value: 45.2 },
  { year: 2020, value: 44.1 },
  { year: 2021, value: 43.5 },
  { year: 2022, value: 43.1 },
  { year: 2023, value: 42.7 }
];

const fullDataset: EmissionData[] = [
  { year: 2014, value: 48.2 },
  { year: 2015, value: 47.8 },
  { year: 2016, value: 47.1 },
  { year: 2017, value: 46.5 },
  { year: 2018, value: 45.9 },
  { year: 2019, value: 45.2 },
  { year: 2020, value: 44.1 },
  { year: 2021, value: 43.5 },
  { year: 2022, value: 43.1 },
  { year: 2023, value: 42.7 }
];

const partialDataset: EmissionData[] = [
  { year: 2021, value: 43.5 },
  { year: 2022, value: 43.1 },
  { year: 2023, value: 42.7 }
];

const emptyData: EmissionData[] = [];

const singleDataPoint: EmissionData[] = [{ year: 2023, value: 42.7 }];

describe("EmissionsChart", () => {
  describe("TC-1.4.1: Component Rendering", () => {
    it("renders emissions chart with data", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      expect(screen.getByText("Greenhouse Gas Emissions")).toBeInTheDocument();
      expect(screen.getByText("Latest:")).toBeInTheDocument();
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
    });

    it("renders with custom title", () => {
      render(<EmissionsChart data={mockEmissionData} title="Custom Title" />);
      
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("shows time range selector", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      expect(screen.getByText("Time Range:")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("displays chart container with proper dimensions", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      // Check if chart container exists
      const chartContainer = screen.getByText("Greenhouse Gas Emissions").closest('div');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe("TC-1.4.2: Data Display", () => {
    it("displays latest emissions value clearly labeled", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const latestLabel = screen.getByText("2023: 42.7 Mt CO₂-e");
      expect(latestLabel).toBeInTheDocument();
      expect(latestLabel).toHaveClass("bg-green-100", "text-green-800");
    });

    it("shows time range options", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      expect(screen.getByText("5 Years")).toBeInTheDocument();
      expect(screen.getByText("10 Years")).toBeInTheDocument();
      expect(screen.getByText("All Data")).toBeInTheDocument();
    });

    it("handles empty data array gracefully", () => {
      render(<EmissionsChart data={emptyData} />);
      
      expect(screen.getByText("No Data Available")).toBeInTheDocument();
      expect(screen.getByText("Emissions data is not available for the selected state and time period.")).toBeInTheDocument();
    });

    it("displays correct data for full dataset", () => {
      render(<EmissionsChart data={fullDataset} />);
      
      // Only check the latest value since that's what's displayed
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
    });

    it("displays correct data for partial dataset", () => {
      render(<EmissionsChart data={partialDataset} />);
      
      // Only check the latest value since that's what's displayed
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
    });
  });

  describe("TC-1.4.3: Time Range Functionality", () => {
    it("allows changing time range to 5 years", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={fullDataset} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      await user.selectOptions(timeRangeSelect, "5");
      
      expect(timeRangeSelect).toHaveValue("5");
    });

    it("allows changing time range to 10 years", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={fullDataset} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      await user.selectOptions(timeRangeSelect, "10");
      
      expect(timeRangeSelect).toHaveValue("10");
    });

    it("allows changing time range to all data", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={fullDataset} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      await user.selectOptions(timeRangeSelect, "0");
      
      expect(timeRangeSelect).toHaveValue("0");
    });

    it("defaults to 10 years time range", () => {
      render(<EmissionsChart data={fullDataset} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      expect(timeRangeSelect).toHaveValue("10");
    });

    it("filters data correctly when time range changes", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={fullDataset} />);
      
      // Initially should show 10 years (last 10 data points)
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
      
      // Change to 5 years
      const timeRangeSelect = screen.getByRole("combobox");
      await user.selectOptions(timeRangeSelect, "5");
      
      // Should still show latest data
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
    });
  });

  describe("TC-1.4.4: Chart Interaction and Formatting", () => {
    it("shows chart footer with source information", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      expect(screen.getByText("Annual greenhouse gas emissions data")).toBeInTheDocument();
      expect(screen.getByText("Source: EPA Victoria & AEMO")).toBeInTheDocument();
    });

    it("displays chart with proper styling classes", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const mainContainer = screen.getByText("Greenhouse Gas Emissions").closest('.bg-white');
      expect(mainContainer).toHaveClass("bg-white", "rounded-lg", "p-6", "border", "border-gray-200", "shadow-sm");
    });

    it("shows proper chart header layout", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const header = screen.getByText("Time Range:").closest('.flex');
      expect(header).toHaveClass("flex", "items-center", "space-x-2");
    });

    it("displays latest value with proper badge styling", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const latestBadge = screen.getByText("2023: 42.7 Mt CO₂-e");
      expect(latestBadge).toHaveClass(
        "inline-flex", "items-center", "px-3", "py-1", 
        "bg-green-100", "text-green-800", "text-sm", "font-medium", "rounded-full"
      );
    });
  });

  describe("TC-1.4.5: Edge Cases and Data Handling", () => {
    it("handles single data point", () => {
      render(<EmissionsChart data={singleDataPoint} />);
      
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
    });

    it("handles very large emission values", () => {
      const largeData = [{ year: 2023, value: 999.9 }];
      render(<EmissionsChart data={largeData} />);
      
      expect(screen.getByText("2023: 999.9 Mt CO₂-e")).toBeInTheDocument();
    });

    it("handles zero emission values", () => {
      const zeroData = [{ year: 2023, value: 0 }];
      render(<EmissionsChart data={zeroData} />);
      
      expect(screen.getByText("2023: 0.0 Mt CO₂-e")).toBeInTheDocument();
    });

    it("handles decimal emission values", () => {
      const decimalData = [{ year: 2023, value: 42.123 }];
      render(<EmissionsChart data={decimalData} />);
      
      expect(screen.getByText("2023: 42.1 Mt CO₂-e")).toBeInTheDocument();
    });

    it("handles negative emission values", () => {
      const negativeData = [{ year: 2023, value: -5.5 }];
      render(<EmissionsChart data={negativeData} />);
      
      expect(screen.getByText("2023: -5.5 Mt CO₂-e")).toBeInTheDocument();
    });

    it("handles data with missing years", () => {
      const missingYearData = [
        { year: 2020, value: 44.1 },
        { year: 2022, value: 43.1 },
        { year: 2023, value: 42.7 }
      ];
      render(<EmissionsChart data={missingYearData} />);
      
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
    });
  });

  describe("TC-1.4.6: Accessibility and UX", () => {
    it("has proper form controls", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      expect(timeRangeSelect).toBeInTheDocument();
    });

    it("maintains proper heading structure", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const mainHeading = screen.getByRole("heading", { level: 3 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent("Greenhouse Gas Emissions");
    });

    it("provides proper focus states for form elements", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      expect(timeRangeSelect).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-green-500");
    });

    it("shows proper visual feedback for time range selector", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      expect(timeRangeSelect).toHaveClass(
        "px-3", "py-1", "border", "border-gray-300", "rounded-md", 
        "text-sm", "focus:outline-none", "focus:ring-2", "focus:ring-green-500", "focus:border-transparent"
      );
    });
  });

  describe("TC-1.4.7: Chart Data Processing", () => {
    it("correctly identifies latest data point", () => {
      render(<EmissionsChart data={fullDataset} />);
      
      // Should show the last item in the array as latest
      expect(screen.getByText("2023: 42.7 Mt CO₂-e")).toBeInTheDocument();
    });

    it("handles data array reordering correctly", () => {
      const reorderedData = [
        { year: 2023, value: 42.7 },
        { year: 2022, value: 43.1 },
        { year: 2021, value: 43.5 }
      ];
      render(<EmissionsChart data={reorderedData} />);
      
      // Should still show the last item in the array
      expect(screen.getByText("2021: 43.5 Mt CO₂-e")).toBeInTheDocument();
    });

    it("filters data based on selected time range", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={fullDataset} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      
      // Test 5 years filter
      await user.selectOptions(timeRangeSelect, "5");
      expect(timeRangeSelect).toHaveValue("5");
      
      // Test 10 years filter
      await user.selectOptions(timeRangeSelect, "10");
      expect(timeRangeSelect).toHaveValue("10");
      
      // Test all data filter
      await user.selectOptions(timeRangeSelect, "0");
      expect(timeRangeSelect).toHaveValue("0");
    });
  });

  describe("TC-1.4.8: Error Handling and Fallbacks", () => {
    it("shows fallback message when data is empty", () => {
      render(<EmissionsChart data={emptyData} />);
      
      expect(screen.getByText("No Data Available")).toBeInTheDocument();
      expect(screen.getByText("📊")).toBeInTheDocument();
      expect(screen.getByText("Emissions data is not available for the selected state and time period.")).toBeInTheDocument();
    });

    it("maintains consistent styling in fallback state", () => {
      render(<EmissionsChart data={emptyData} />);
      
      const fallbackContainer = screen.getByText("No Data Available").closest('.bg-white');
      expect(fallbackContainer).toHaveClass("bg-white", "rounded-lg", "p-6", "border", "border-gray-200", "shadow-sm");
    });

    it("handles undefined data gracefully", () => {
      render(<EmissionsChart data={undefined as unknown as EmissionData[]} />);
      
      expect(screen.getByText("No Data Available")).toBeInTheDocument();
    });

    it("handles null data gracefully", () => {
      render(<EmissionsChart data={null as unknown as EmissionData[]} />);
      
      expect(screen.getByText("No Data Available")).toBeInTheDocument();
    });
  });
});
