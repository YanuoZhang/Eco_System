import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import PageHeader from "../PageHeader";

describe("PageHeader", () => {
  const defaultProps = {
    title: "Test Title",
    description: "Test Description",
    icon: "🚀",
  };

  it("renders title and description correctly", () => {
    render(<PageHeader {...defaultProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("displays the icon correctly", () => {
    render(<PageHeader {...defaultProps} />);

    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("applies default gradient colors when not specified", () => {
    render(<PageHeader {...defaultProps} />);

    const iconContainer = screen.getByText("🚀").closest("div");
    expect(iconContainer).toHaveClass("from-green-500", "to-blue-500");
  });

  it("applies custom gradient colors when specified", () => {
    render(<PageHeader {...defaultProps} gradientColors="from-red-500 to-yellow-500" />);

    const iconContainer = screen.getByText("🚀").closest("div");
    expect(iconContainer).toHaveClass("from-red-500", "to-yellow-500");
  });

  it("shows Back to Homepage button when onBackToHomepage is provided", () => {
    const mockOnBackToHomepage = vi.fn();
    render(<PageHeader {...defaultProps} onBackToHomepage={mockOnBackToHomepage} />);

    const backButton = screen.getByRole("button", { name: /back to homepage/i });
    expect(backButton).toBeInTheDocument();
  });

  it("does not show Back to Homepage button when onBackToHomepage is not provided", () => {
    render(<PageHeader {...defaultProps} />);

    const backButton = screen.queryByRole("button", { name: /back to homepage/i });
    expect(backButton).not.toBeInTheDocument();
  });

  it("calls onBackToHomepage when Back to Homepage button is clicked", () => {
    const mockOnBackToHomepage = vi.fn();
    render(<PageHeader {...defaultProps} onBackToHomepage={mockOnBackToHomepage} />);

    const backButton = screen.getByRole("button", { name: /back to homepage/i });
    fireEvent.click(backButton);

    expect(mockOnBackToHomepage).toHaveBeenCalledTimes(1);
  });

  it("shows tool badge by default", () => {
    render(<PageHeader {...defaultProps} />);

    expect(screen.getByText("Analytics Tool")).toBeInTheDocument();
    expect(screen.getByText("State-wide environmental insights")).toBeInTheDocument();
  });

  it("hides tool badge when showToolBadge is false", () => {
    render(<PageHeader {...defaultProps} showToolBadge={false} />);

    expect(screen.queryByText("Analytics Tool")).not.toBeInTheDocument();
    expect(screen.queryByText("State-wide environmental insights")).not.toBeInTheDocument();
  });

  it("uses custom tool badge text and description when provided", () => {
    render(
      <PageHeader
        {...defaultProps}
        toolBadgeText="Custom Tool"
        toolBadgeDescription="Custom description"
      />,
    );

    expect(screen.getByText("Custom Tool")).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    render(<PageHeader {...defaultProps} />);

    // Find the outermost container with the styling classes
    const header = screen.getByText("Test Title").closest('div[class*="bg-white/90"]');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("bg-white/90");
    expect(header).toHaveClass("backdrop-blur-sm");
    expect(header).toHaveClass("border-b");
    expect(header).toHaveClass("border-green-200/50");
  });
});
