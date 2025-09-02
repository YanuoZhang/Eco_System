import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ClimateTargetSidebar from "../ClimateTargetSidebar";
import { ApiService } from "@/services/api";

// Mock the API service
vi.mock("@/services/api", () => ({
  ApiService: {
    getClimateTargets: vi.fn(),
  },
}));

const mockApiService = vi.mocked(ApiService);

describe("ClimateTargetSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display climate plan name and progress on page load", async () => {
    const mockClimateData = {
      targetYear: 2030,
      baselineYear: 2005,
      targetValuePct: 50,
      planName: "Victoria 2030 Climate Target",
      progress: 18.5,
      progressDescription: "Achieved: 18.5%",
      latestEmissions: { year: 2023, value: 42.7 },
      notes: "Victoria 2030 climate target",
    };

    mockApiService.getClimateTargets.mockResolvedValue(mockClimateData);

    render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);

    // Check loading state
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId("plan-name")).toHaveTextContent("Victoria 2030 Climate Target");
    });

    expect(screen.getByTestId("progress-text")).toHaveTextContent("Achieved: 18.5%");
    expect(screen.getByTestId("target-year")).toHaveTextContent("Target: 2030");
  });

  it("should update sidebar info when state changes", async () => {
    const mockVicData = {
      targetYear: 2030,
      baselineYear: 2005,
      targetValuePct: 50,
      planName: "Victoria 2030 Climate Target",
      progress: 18.5,
      progressDescription: "Achieved: 18.5%",
      latestEmissions: { year: 2023, value: 42.7 },
      notes: "Victoria 2030 climate target",
    };

    const mockNswData = {
      targetYear: 2030,
      baselineYear: 2005,
      targetValuePct: 50,
      planName: "New South Wales 2030 Climate Target",
      progress: 12.3,
      progressDescription: "Achieved: 12.3%",
      latestEmissions: { year: 2023, value: 52.8 },
      notes: "NSW 2030 climate target",
    };

    mockApiService.getClimateTargets
      .mockResolvedValueOnce(mockVicData)
      .mockResolvedValueOnce(mockNswData);

    const { rerender } = render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);

    // Wait for VIC data
    await waitFor(() => {
      expect(screen.getByTestId("plan-name")).toHaveTextContent("Victoria 2030 Climate Target");
    });

    // Change to NSW
    rerender(<ClimateTargetSidebar stateName="New South Wales (NSW)" />);

    // Wait for NSW data
    await waitFor(() => {
      expect(screen.getByTestId("plan-name")).toHaveTextContent(
        "New South Wales 2030 Climate Target",
      );
    });

    expect(screen.getByTestId("progress-text")).toHaveTextContent("Achieved: 12.3%");
  });

  it("should show loading skeleton during data fetch", () => {
    mockApiService.getClimateTargets.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                targetYear: 2030,
                baselineYear: 2005,
                targetValuePct: 50,
                planName: "Test Plan",
                progress: 10,
                progressDescription: "Achieved: 10%",
                latestEmissions: null,
                notes: "Test notes",
              }),
            1000,
          ),
        ),
    );

    render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should fallback to mock data when API fails", async () => {
    mockApiService.getClimateTargets.mockRejectedValue(new Error("API Error"));

    render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);

    await waitFor(() => {
      expect(screen.getByTestId("plan-name")).toHaveTextContent("Victoria 2030 Net Zero Plan");
    });

    expect(screen.getByTestId("progress-text")).toHaveTextContent("Achieved: 18%");
  });

  it("should display correct target year and percentage", async () => {
    const mockData = {
      targetYear: 2030,
      baselineYear: 2005,
      targetValuePct: 50,
      planName: "Test Climate Target",
      progress: 25,
      progressDescription: "Achieved: 25%",
      latestEmissions: { year: 2023, value: 40 },
      notes: "Test climate target",
    };

    mockApiService.getClimateTargets.mockResolvedValue(mockData);

    render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);

    await waitFor(() => {
      expect(screen.getByText("2030 Target")).toBeInTheDocument();
      expect(screen.getByText("-50%")).toBeInTheDocument();
    });
  });

  it("should display progress bar with correct width", async () => {
    const mockData = {
      targetYear: 2030,
      baselineYear: 2005,
      targetValuePct: 50,
      planName: "Test Climate Target",
      progress: 25,
      progressDescription: "Achieved: 25%",
      latestEmissions: { year: 2023, value: 40 },
      notes: "Test climate target",
    };

    mockApiService.getClimateTargets.mockResolvedValue(mockData);

    render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);

    await waitFor(() => {
      const progressBar = screen.getByTestId("progress-bar");
      const progressFill = progressBar.querySelector("div");
      expect(progressFill).toHaveStyle("width: 50%"); // 25/50 * 100 = 50%
    });
  });

  it("should show no data state when no climate target is available", async () => {
    mockApiService.getClimateTargets.mockRejectedValue(new Error("No data"));

    render(<ClimateTargetSidebar stateName="Unknown State" />);

    await waitFor(() => {
      expect(screen.getByText("No Climate Data")).toBeInTheDocument();
      expect(
        screen.getByText("Climate target information is not available for this state."),
      ).toBeInTheDocument();
    });
  });

  it("should call API with correct state code", async () => {
    const mockData = {
      targetYear: 2030,
      baselineYear: 2005,
      targetValuePct: 50,
      planName: "Test Plan",
      progress: 10,
      progressDescription: "Achieved: 10%",
      latestEmissions: null,
      notes: "Test notes",
    };

    mockApiService.getClimateTargets.mockResolvedValue(mockData);

    render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);

    await waitFor(() => {
      expect(mockApiService.getClimateTargets).toHaveBeenCalledWith("VIC");
    });
  });

  it("should handle different state name formats", async () => {
    const mockData = {
      targetYear: 2030,
      baselineYear: 2005,
      targetValuePct: 50,
      planName: "Test Plan",
      progress: 10,
      progressDescription: "Achieved: 10%",
      latestEmissions: null,
      notes: "Test notes",
    };

    mockApiService.getClimateTargets.mockResolvedValue(mockData);

    const { rerender } = render(<ClimateTargetSidebar stateName="Victoria (VIC)" />);
    await waitFor(() => {
      expect(mockApiService.getClimateTargets).toHaveBeenCalledWith("VIC");
    });

    rerender(<ClimateTargetSidebar stateName="New South Wales" />);
    await waitFor(() => {
      expect(mockApiService.getClimateTargets).toHaveBeenCalledWith("New");
    });
  });
});
