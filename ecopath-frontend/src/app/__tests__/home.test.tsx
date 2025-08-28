import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders Journey Homepage title", () => {
    render(<Home />);
    expect(screen.getByText(/Journey Homepage/i)).toBeInTheDocument();
  });
});
