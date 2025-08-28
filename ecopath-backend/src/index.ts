import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/environment", (_req, res) => {
  res.json({ env: process.env.NODE_ENV || "development" });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
