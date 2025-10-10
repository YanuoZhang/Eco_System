// src/routes/pledgeImpact.ts
import { Router, Request, Response } from "express";
import axios from "axios";
import { computeImpactForState } from "../services/pledgeImpactService";

const router = Router();

/**
 * POST /api/pledge/impact
 * body: {
 *   "state_code": "VIC",
 *   "population": 6700000,
 *   "pledges": [
 *     {"title":"Try Meatless Mondays","category":"FOOD"},
 *     {"title":"Unplug and Switch Off","category":"ENERGY"}
 *   ]
 * }
 * 返回: 各年份 baseline + reduction + adjusted + 平均减排比例
 */
router.post("/impact", async (req: Request, res: Response) => {
  try {
    console.log("📩 Received pledge impact request:", req.body);

    const { state_code, population, pledges } = req.body || {};
    if (!state_code || typeof population !== "number" || !Array.isArray(pledges)) {
      return res
        .status(400)
        .json({ success: false, error: "state_code, population, pledges[] are required" });
    }

    // 1️⃣ 调 Gemini：估算每个 pledge 的减排效果
    const aiOut = await computeImpactForState(state_code, population, pledges);

    // 计算 pledge 总减排量 (kg/人/年)
    const total_per_person = aiOut.impacts.reduce(
      (acc, p) => acc + (p.per_person_kg_per_year || 0),
      0,
    );

    // 默认采纳率 50%
    const adoption_rate = 0.5;
    // 每年总减排量 (Mt CO₂)
    const reduction_mt_per_year = (total_per_person * population * adoption_rate) / 1e9;

    // 2️⃣ 调 ML 服务获取未来 10 年的预测
    const mlResponse = await axios.post("http://127.0.0.1:8001/predict");
    const predictions = mlResponse.data?.predictions || [];

    // 只取指定州
    const statePredictions = predictions.filter(
      (p: any) => p.state_id === state_code.toUpperCase(),
    );

    if (!statePredictions.length) {
      return res
        .status(404)
        .json({ success: false, error: `No baseline prediction found for ${state_code}` });
    }

    // 3️⃣ 计算每一年的 adjusted
    const adjustedPredictions = statePredictions.map((p: any) => {
      const base = Number(
        p.predicted_emission_mt?.predicted_emission_mt ?? p.predicted_emission_mt ?? 0,
      );
      return {
        year: p.year,
        baseline_mt: Number(base.toFixed(3)),
        reduction_mt: Number(reduction_mt_per_year.toFixed(3)),
        adjusted_mt: Number((base - reduction_mt_per_year).toFixed(3)),
      };
    });

    // 4️⃣ 汇总平均值
    const avgBaseLine =
      adjustedPredictions.reduce((sum: number, rec: any) => sum + Number(rec.baseline_mt || 0), 0) /
      adjustedPredictions.length;

    const avgAdjusted =
      adjustedPredictions.reduce((sum: number, rec: any) => sum + Number(rec.adjusted_mt || 0), 0) /
      adjustedPredictions.length;

    // 5️⃣ 计算减排百分比
    const reduction_percentage = ((avgBaseLine - avgAdjusted) / avgBaseLine) * 100;

    // 6️⃣ 返回综合结果
    res.json({
      success: true,
      state_code: state_code.toUpperCase(),
      population,
      adoption_rate,
      average_baseline_mt: Number(avgBaseLine.toFixed(3)),
      average_adjusted_mt: Number(avgAdjusted.toFixed(3)),
      reduction_percentage: Number(reduction_percentage.toFixed(2)), // 👈 新增字段
      yearly_data: adjustedPredictions,
      impacts: aiOut.impacts,
      summary: `Predicted ${adjustedPredictions.length} years for ${state_code} (2026–2036)`,
    });
  } catch (e: any) {
    console.error("❌ pledge/impact failed:", e.message || e);
    res.status(500).json({ success: false, error: e.message || "Internal error" });
  }
});

export default router;
