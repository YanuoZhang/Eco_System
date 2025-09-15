import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const usePathnameMock = vi.fn(() => "/");
vi.mock("next/navigation", () => ({ usePathname: () => usePathnameMock() }));
vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import Nav from "@/components/Nav";

describe("Nav", () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/");
  });

  it("renders brand and primary links", () => {
    render(<Nav />);
    expect(screen.getByText("EcoPath")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Explore My Impact")).toBeInTheDocument();
  });

  it("applies active class on Home route", () => {
    usePathnameMock.mockReturnValue("/");
    render(<Nav />);
    const home = screen.getByText("Home");
    expect(home.className).toMatch(/text-white|text-orange-600/);
  });

  it("applies active class on Quiz route", () => {
    usePathnameMock.mockReturnValue("/quiz");
    render(<Nav />);
    const quiz = screen.getByText("Explore My Impact");
    expect(quiz.className).toMatch(/text-orange-600|text-white/);
  });
});
