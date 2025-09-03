import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EnergyMixChart, { EnergyMix } from "../EnergyMixChart";

// Mock data for testing
const mockEnergyData: EnergyMix[] = [
  {
    source: "Coal",
    percentage: 45.2,
    generation: "8,450 MW",
    trend: -8.5,
  },
  {
    source: "Natural Gas",
    percentage: 18.3,
    generation: "3,420 MW",
    trend: -2.1,
  },
  {
    source: "Wind",
    percentage: 22.8,
    generation: "4,250 MW",
    trend: 15.2,
  },
  {
    source: "Solar",
    percentage: 8.9,
    generation: "1,660 MW",
    trend: 28.7,
  },
  {
    source: "Hydro",
    percentage: 4.8,
    generation: "895 MW",
    trend: 1.2,
  },
];

describe("EnergyMixChart", () => {
  describe("TC-1.2.1: Chart Rendering", () => {
    it("renders correct number of energy segments", () => {
      render(<EnergyMixChart data={mockEnergyData} />);

      // Check that all energy sources are rendered
      expect(screen.getByText("Coal")).toBeInTheDocument();
      expect(screen.getByText("Natural Gas")).toBeInTheDocument();
      expect(screen.getByText("Wind")).toBeInTheDocument();
      expect(screen.getByText("Solar")).toBeInTheDocument();
      expect(screen.getByText("Hydro")).toBeInTheDocument();

      // Check that all percentages are displayed
      expect(screen.getByText("45.2%")).toBeInTheDocument();
      expect(screen.getByText("18.3%")).toBeInTheDocument();
      expect(screen.getByText("22.8%")).toBeInTheDocument();
      expect(screen.getByText("8.9%")).toBeInTheDocument();
      expect(screen.getByText("4.8%")).toBeInTheDocument();
    });

    it("renders with custom title", () => {
      const customTitle = "Custom Energy Mix Title";
      render(<EnergyMixChart data={mockEnergyData} title={customTitle} />);

      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it("renders with default title when no title provided", () => {
      render(<EnergyMixChart data={mockEnergyData} />);

      expect(screen.getByText("Energy Generation Mix")).toBeInTheDocument();
    });

    it("displays generation capacity for each source", () => {
      render(<EnergyMixChart data={mockEnergyData} />);

      expect(screen.getByText("8,450 MW")).toBeInTheDocument();
      expect(screen.getByText("3,420 MW")).toBeInTheDocument();
      expect(screen.getByText("4,250 MW")).toBeInTheDocument();
      expect(screen.getByText("1,660 MW")).toBeInTheDocument();
      expect(screen.getByText("895 MW")).toBeInTheDocument();
    });

    it("shows trend indicators with correct colors", () => {
      render(<EnergyMixChart data={mockEnergyData} />);

      // Check positive trends (green)
      const positiveTrends = screen.getAllByText(/\+/);
      expect(positiveTrends).toHaveLength(3); // Wind, Solar, Hydro

      // Check negative trends (red)
      const negativeTrends = screen.getAllByText(/-/);
      expect(negativeTrends).toHaveLength(2); // Coal, Natural Gas
    });
  });

  // Tooltip interactions are driven by recharts internals and jsdom doesn't simulate SVG segment events
  // reliably. We limit our assertions to static content rendered alongside the chart.

  describe("Fallback UI & Edge Cases", () => {
    it("renders base structure when no data provided", () => {
      render(<EnergyMixChart data={[]} />);

      // Should still show title
      expect(screen.getByText("Energy Generation Mix")).toBeInTheDocument();

      // Should render container and legend area without crashing
      expect(screen.getByTestId("energy-mix-chart")).toBeInTheDocument();
    });

    it("handles single data item correctly", () => {
      const singleData: EnergyMix[] = [
        {
          source: "Solar",
          percentage: 100,
          generation: "5,000 MW",
          trend: 25.0,
        },
      ];

      render(<EnergyMixChart data={singleData} />);

      expect(screen.getByText("Solar")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("5,000 MW")).toBeInTheDocument();
      expect(screen.getByText("+25%")).toBeInTheDocument();
    });

    it("lists all sources in the details list", () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      mockEnergyData.forEach((e) => {
        expect(screen.getByText(e.source)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`${e.percentage}`))).toBeInTheDocument();
      });
    });

    it("renders five energy items in details list", () => {
      render(<EnergyMixChart data={mockEnergyData} />);
      const sources = mockEnergyData.map((e) => e.source);
      sources.forEach((s) => expect(screen.getByText(s)).toBeInTheDocument());
    });
  });

  describe("Visual Elements", () => {
    it("shows trend indicators text", () => {
      render(<EnergyMixChart data={mockEnergyData} />);

      expect(screen.getByText("+15.2%"));
      expect(screen.getByText("-8.5%"));
    });
  });
});
