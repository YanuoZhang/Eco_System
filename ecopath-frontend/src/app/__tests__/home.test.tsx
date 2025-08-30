import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders Environmental Journey title", () => {
    render(<Home />);
    expect(screen.getByText(/Your Environmental Journey/i)).toBeInTheDocument();
  });
});
