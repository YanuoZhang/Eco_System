import request from "supertest";
import express from "express";
import cors from "cors";
import morgan from "morgan";

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));
  app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));
  return app;
}

describe("GET /healthz", () => {
  it("returns 200 ok", async () => {
    const app = createApp();
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
