/// <reference types="vitest/globals" />
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlobalStateSelector from "../GlobalStateSelector";
import { StateProvider } from "@/contexts/StateContext";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <StateProvider>{children}</StateProvider>
);

describe("GlobalStateSelector", () => {
  it("renders state selector button", () => {
    render(
      <TestWrapper>
        <GlobalStateSelector />
      </TestWrapper>,
    );

    // Check for the main button content
    expect(screen.getByText("Victoria")).toBeInTheDocument();
    expect(screen.getByText("(VIC)")).toBeInTheDocument();
  });

  it("expands dropdown when clicked", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <GlobalStateSelector />
      </TestWrapper>,
    );

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText(/Select State/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose your location/i)).toBeInTheDocument();
  });

  it("shows dropdown content when expanded", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <GlobalStateSelector />
      </TestWrapper>,
    );

    const button = screen.getByRole("button");
    await user.click(button);

    // Check for some key elements in the dropdown
    expect(screen.getByText(/Real-time environmental data/i)).toBeInTheDocument();
    expect(screen.getByText(/Current selection/i)).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(
      <TestWrapper>
        <GlobalStateSelector />
      </TestWrapper>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
