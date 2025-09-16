import { describe, it, expect, vi } from "vitest";
import { summarizeText } from "../gemini";

vi.mock("../gemini", () => ({
  summarizeText: vi.fn(async (_text: string) => "mock-summary"),
}));

describe("summarizeText", () => {
  it("returns a summary string (mocked)", async () => {
    const summary = await summarizeText("Some content to summarize");
    expect(summary).toBe("mock-summary");
  });
});
