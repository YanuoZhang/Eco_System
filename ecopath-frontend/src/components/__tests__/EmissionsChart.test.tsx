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

const emptyData: EmissionData[] = [];

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
  });

  describe("TC-1.4.3: Time Range Functionality", () => {
    it("allows changing time range to 5 years", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={mockEmissionData} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      await user.selectOptions(timeRangeSelect, "5");
      
      expect(timeRangeSelect).toHaveValue("5");
    });

    it("allows changing time range to 10 years", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={mockEmissionData} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      await user.selectOptions(timeRangeSelect, "10");
      
      expect(timeRangeSelect).toHaveValue("10");
    });

    it("allows changing time range to all data", async () => {
      const user = userEvent.setup();
      render(<EmissionsChart data={mockEmissionData} />);
      
      const timeRangeSelect = screen.getByRole("combobox");
      await user.selectOptions(timeRangeSelect, "0");
      
      expect(timeRangeSelect).toHaveValue("0");
    });
  });

  describe("TC-1.4.4: Chart Interaction", () => {
    it("displays chart container with proper dimensions", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      const chartContainer = screen.getByText("Greenhouse Gas Emissions").closest('div')?.parentElement;
      expect(chartContainer).toBeInTheDocument();
    });

    it("shows chart footer with source information", () => {
      render(<EmissionsChart data={mockEmissionData} />);
      
      expect(screen.getByText("Annual greenhouse gas emissions data")).toBeInTheDocument();
      expect(screen.getByText("Source: EPA Victoria & AEMO")).toBeInTheDocument();
    });
  });

  describe("TC-1.4.5: Edge Cases", () => {
    it("handles single data point", () => {
      const singleData = [{ year: 2023, value: 42.7 }];
      render(<EmissionsChart data={singleData} />);
      
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
  });

  describe("TC-1.4.6: Accessibility", () => {
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
  });
});
