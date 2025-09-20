import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import InfoPage from "@/app/info/page";
import PledgePage from "@/app/pledge/page";
import NotFound from "@/app/not-found";

describe("Static pages", () => {
  it("renders Info page", () => {
    render(<InfoPage />);
    expect(
      screen.getByRole("heading", { name: /Australian Climate Data Center/i }),
    ).toBeInTheDocument();
    // Content may evolve; assert heading exists only
  });

  it("renders Pledge page", () => {
    render(<PledgePage />);
    expect(screen.getByRole("heading", { name: /Pledge/i })).toBeInTheDocument();
    // Content revamped: check accessible heading only
  });

  it("renders Not Found page", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
    expect(screen.getByText(/not available/i)).toBeInTheDocument();
  });
});
