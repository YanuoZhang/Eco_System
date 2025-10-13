# ml_service/apply_pledge_impact.py
from typing import List, Dict

def apply_pledge_impact(predictions: List[Dict], pledges: List[Dict], adoption_rate: float = 0.5):
    """
    Adjust predicted emissions by subtracting pledge-based reductions.
    predictions: 来自 /predict 的结果 [{state_id, year, predicted_emission_mt, population}, ...]
    pledges: 来自 /api/pledge/impact 的 Gemini 输出 [{per_person_kg_per_year, ...}]
    adoption_rate: 采纳率 (0.3 / 0.5 / 1.0)
    """
    total_reduction_per_person = sum(p["per_person_kg_per_year"] for p in pledges)
    adjusted_predictions = []

    for record in predictions:
        state_pop = record["population"]
        # 计算总减排 (Mt)
        reduction_mt = (total_reduction_per_person * state_pop * adoption_rate) / 1e9
        adjusted = record.copy()
        adjusted["adjusted_emission_mt"] = round(record["predicted_emission_mt"] - reduction_mt, 3)
        adjusted["reduction_mt"] = round(reduction_mt, 3)
        adjusted_predictions.append(adjusted)

    return {
        "success": True,
        "adoption_rate": adoption_rate,
        "pledge_total_kg_per_person": total_reduction_per_person,
        "adjusted_predictions": adjusted_predictions
    }
