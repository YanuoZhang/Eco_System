import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import DataSources from "../DataSources";

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, "open", {
  value: mockOpen,
  writable: true,
});

describe("DataSources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-1.7.1: Data Sources button appears on scroll", () => {
    it("displays Data Sources button", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Data Sources");
    });

    it("shows book icon in Data Sources button", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      const icon = button.querySelector("span:first-child");
      expect(icon).toHaveTextContent("📚");
    });

    it("has correct button styling", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      expect(button).toHaveClass("bg-green-100", "text-green-700", "rounded-lg");
    });
  });

  describe("TC-1.7.2: Open dataset list modal/panel", () => {
    it("opens modal when Data Sources button is clicked", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      expect(screen.getByText("Official datasets used in our analysis")).toBeInTheDocument();
      expect(
        screen.getByText("All data sources are official government and research institutions"),
      ).toBeInTheDocument();
    });

    it("displays all dataset sources in modal", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      // Check for key datasets
      expect(screen.getByText("ABS Census Data")).toBeInTheDocument();
      expect(screen.getByText("AEMO Emissions Data")).toBeInTheDocument();
      expect(screen.getByText("City of Melbourne Open Data")).toBeInTheDocument();
      expect(screen.getByText("Department of Climate Change")).toBeInTheDocument();
    });

    it("shows dataset categories and descriptions", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      expect(screen.getByText("Demographics")).toBeInTheDocument();
      expect(screen.getByText("Energy")).toBeInTheDocument();
      expect(screen.getByText("Local Government")).toBeInTheDocument();
      expect(screen.getByText("Climate")).toBeInTheDocument();
    });

    it("closes modal when close button is clicked", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      expect(screen.getByText("Official datasets used in our analysis")).toBeInTheDocument();

      const closeButton = screen.getByText("✕");
      fireEvent.click(closeButton);

      expect(screen.queryByText("Official datasets used in our analysis")).not.toBeInTheDocument();
    });
  });

  describe("TC-1.7.3: Open source in new tab", () => {
    it("opens dataset URL in new tab when clicked", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      const absDataset = screen.getByText("ABS Census Data").closest("div");
      expect(absDataset).toBeInTheDocument();

      if (absDataset) {
        fireEvent.click(absDataset);
        expect(mockOpen).toHaveBeenCalledWith(
          "https://www.abs.gov.au/statistics/people/population",
          "_blank",
          "noopener,noreferrer",
        );
      }
    });

    it("opens multiple datasets in new tabs", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      // Click on AEMO dataset
      const aemoDataset = screen.getByText("AEMO Emissions Data").closest("div");
      if (aemoDataset) {
        fireEvent.click(aemoDataset);
      }

      // Click on Melbourne dataset
      const melbourneDataset = screen.getByText("City of Melbourne Open Data").closest("div");
      if (melbourneDataset) {
        fireEvent.click(melbourneDataset);
      }

      expect(mockOpen).toHaveBeenCalledTimes(2);
    });
  });

  describe("Visual Elements and Styling", () => {
    it("has proper modal header styling", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      const header = screen
        .getByText("Official datasets used in our analysis")
        .closest('div[class*="bg-gradient-to-r"]');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("bg-gradient-to-r", "from-green-500", "to-blue-500");
    });

    it("displays dataset cards with proper styling", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      const datasetCard = screen
        .getByText("ABS Census Data")
        .closest('div[class*="border border-gray-200"]');
      expect(datasetCard).toBeInTheDocument();
      expect(datasetCard).toHaveClass("border", "rounded-lg", "p-4");
    });

    it("shows hover effects on dataset cards", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      const datasetCard = screen
        .getByText("ABS Census Data")
        .closest('div[class*="border border-gray-200"]');
      expect(datasetCard).toBeInTheDocument();
      expect(datasetCard).toHaveClass("hover:border-green-300", "hover:shadow-md");
    });
  });

  describe("Accessibility and UX", () => {
    it("has proper modal focus management", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      expect(screen.getByText("Official datasets used in our analysis")).toBeInTheDocument();
      expect(screen.getByText("✕")).toBeInTheDocument();
    });

    it("displays helpful footer information", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      expect(
        screen.getByText("All data sources are official government and research institutions"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Click any dataset to verify the original source"),
      ).toBeInTheDocument();
    });

    it("shows proper dataset icons", () => {
      render(<DataSources />);

      const button = screen.getByRole("button", { name: /data sources/i });
      fireEvent.click(button);

      expect(screen.getByText("📊")).toBeInTheDocument(); // ABS
      expect(screen.getByText("⚡")).toBeInTheDocument(); // AEMO
      expect(screen.getByText("🏙️")).toBeInTheDocument(); // Melbourne
    });
  });
});
