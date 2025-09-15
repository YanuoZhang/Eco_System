import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import InfoPage from "@/app/info/page";
import PledgePage from "@/app/pledge/page";
import NotFound from "@/app/not-found";

describe("Static pages", () => {
  it("renders Info page", () => {
    render(<InfoPage />);
    expect(screen.getByRole("heading", { name: /Info/i })).toBeInTheDocument();
    expect(screen.getByText(/Placeholder page for Info/i)).toBeInTheDocument();
  });

  it("renders Pledge page", () => {
    render(<PledgePage />);
    expect(screen.getByRole("heading", { name: /Pledge/i })).toBeInTheDocument();
    expect(screen.getByText(/Placeholder page for Pledge/i)).toBeInTheDocument();
  });

  it("renders Not Found page", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
    expect(screen.getByText(/not available/i)).toBeInTheDocument();
  });
});
