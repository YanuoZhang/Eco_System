import { describe, it, expect, vi, beforeEach } from "vitest";

const cronSchedule = vi.fn();
vi.mock("node-cron", () => ({ schedule: cronSchedule }));

vi.mock("../services/newsService", () => ({ performWeeklyNewsUpdate: vi.fn() }));
const news = await import("../services/newsService");

describe("NEWS_AUTO_UPDATE flag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables cron and initial fetch when set to false", async () => {
    process.env.NEWS_AUTO_UPDATE = "false";
    // Import server entry to execute side effects
    await import("../index");
    expect(cronSchedule).not.toHaveBeenCalled();
    // performWeeklyNewsUpdate should not be called
    expect((news as any).performWeeklyNewsUpdate).not.toHaveBeenCalled();
  });
});
