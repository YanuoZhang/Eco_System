import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { vi } from "vitest";
import GlobalStateSelector from "../GlobalStateSelector";
import { ApiService } from "@/services/api";

// Mock the API service
vi.mock("@/services/api", () => ({
  ApiService: {
    getStates: vi.fn(),
  },
}));

const mockApiService = vi.mocked(ApiService);

// Mock the StateContext
const mockSetSelectedState = vi.fn();
const mockSelectedState = "Victoria (VIC)";

vi.mock("@/contexts/StateContext", () => ({
  useStateContext: () => ({
    selectedState: mockSelectedState,
    setSelectedState: mockSetSelectedState,
  }),
}));

describe("GlobalStateSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load states from API on mount", async () => {
    const mockStates = [
      { id: "VIC", name: "Victoria", abbreviation: "VIC", displayName: "Victoria (VIC)" },
      {
        id: "NSW",
        name: "New South Wales",
        abbreviation: "NSW",
        displayName: "New South Wales (NSW)",
      },
      { id: "QLD", name: "Queensland", abbreviation: "QLD", displayName: "Queensland (QLD)" },
    ];

    // Mock a delayed API response to test loading state
    mockApiService.getStates.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockStates), 100)),
    );

    await act(async () => {
      render(<GlobalStateSelector />);
    });

    // Open dropdown to see loading state
    const selector = screen.getByTestId("state-selector");
    await act(async () => {
      fireEvent.click(selector);
    });

    // Should show loading state initially
    expect(screen.getByText("Loading states...")).toBeInTheDocument();

    // Wait for states to load
    await waitFor(() => {
      expect(mockApiService.getStates).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId("state-option-VIC")).toBeInTheDocument();
      expect(screen.getByTestId("state-option-NSW")).toBeInTheDocument();
      expect(screen.getByTestId("state-option-QLD")).toBeInTheDocument();
    });
  });

  it("should handle API error gracefully with fallback data", async () => {
    // Mock a delayed rejection to test loading state
    mockApiService.getStates.mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error("API Error")), 100)),
    );

    await act(async () => {
      render(<GlobalStateSelector />);
    });

    // Open dropdown to see loading state
    const selector = screen.getByTestId("state-selector");
    await act(async () => {
      fireEvent.click(selector);
    });

    // Should show loading state initially
    expect(screen.getByText("Loading states...")).toBeInTheDocument();

    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText("Failed to load states")).toBeInTheDocument();
      expect(screen.getByText("Using fallback data")).toBeInTheDocument();
    });

    // Verify that the component still renders without crashing
    expect(screen.getByTestId("state-selector")).toBeInTheDocument();
  });

  it("should call setSelectedState when a state is selected", async () => {
    const mockStates = [
      { id: "VIC", name: "Victoria", abbreviation: "VIC", displayName: "Victoria (VIC)" },
      {
        id: "NSW",
        name: "New South Wales",
        abbreviation: "NSW",
        displayName: "New South Wales (NSW)",
      },
    ];

    mockApiService.getStates.mockResolvedValue(mockStates);

    await act(async () => {
      render(<GlobalStateSelector />);
    });

    // Wait for states to load
    await waitFor(() => {
      expect(mockApiService.getStates).toHaveBeenCalled();
    });

    // Open dropdown
    const selector = screen.getByTestId("state-selector");
    await act(async () => {
      fireEvent.click(selector);
    });

    // Click on NSW
    await waitFor(() => {
      const nswOption = screen.getByTestId("state-option-NSW");
      act(() => {
        fireEvent.click(nswOption);
      });
    });

    expect(mockSetSelectedState).toHaveBeenCalledWith("New South Wales (NSW)");
  });

  it("should display current selection correctly", async () => {
    const mockStates = [
      { id: "VIC", name: "Victoria", abbreviation: "VIC", displayName: "Victoria (VIC)" },
      {
        id: "NSW",
        name: "New South Wales",
        abbreviation: "NSW",
        displayName: "New South Wales (NSW)",
      },
    ];

    mockApiService.getStates.mockResolvedValue(mockStates);

    await act(async () => {
      render(<GlobalStateSelector />);
    });

    // Wait for states to load
    await waitFor(() => {
      expect(mockApiService.getStates).toHaveBeenCalled();
    });

    // Open dropdown
    const selector = screen.getByTestId("state-selector");
    await act(async () => {
      fireEvent.click(selector);
    });

    // Check that current selection is highlighted
    await waitFor(() => {
      const vicOption = screen.getByTestId("state-option-VIC");
      expect(vicOption).toHaveClass("bg-green-100");
      expect(screen.getByText("Current selection")).toBeInTheDocument();
    });
  });

  it("should close dropdown when clicking outside", async () => {
    const mockStates = [
      { id: "VIC", name: "Victoria", abbreviation: "VIC", displayName: "Victoria (VIC)" },
    ];

    mockApiService.getStates.mockResolvedValue(mockStates);

    await act(async () => {
      render(<GlobalStateSelector />);
    });

    // Wait for states to load
    await waitFor(() => {
      expect(mockApiService.getStates).toHaveBeenCalled();
    });

    // Open dropdown
    const selector = screen.getByTestId("state-selector");
    await act(async () => {
      fireEvent.click(selector);
    });

    // Verify dropdown is open by checking for the state option
    await waitFor(() => {
      expect(screen.getByTestId("state-option-VIC")).toBeInTheDocument();
    });

    // Click outside
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByTestId("state-option-VIC")).not.toBeInTheDocument();
    });
  });
});
