// ecopath-backend/src/services/pledgeImpactService.ts
import { estimatePledgeReduction, PledgeInputForAI } from "../gemini";

export interface PledgeImpactInput {
  title: string;
  description?: string;
  category?: string;
}

export interface ImpactScenario {
  adoption_rate: number; // 比如 0.3 / 0.5 / 1.0
  reduction_mt_total: number; // Mt CO2 / year
}

export interface PledgeImpactRow {
  title: string;
  per_person_kg_per_year: number;
  confidence: number;
  rationale: string;
  scenarios: ImpactScenario[];
}

export interface PledgeImpactResponse {
  state_code: string;
  population: number;
  impacts: PledgeImpactRow[];
}

/**
 * 根据 pledge 列表 + 州人口，计算 30%/50%/100% 采纳率下的年减排（Mt）
 * 人口由前端传（或你们后续可以从数据库/服务获取）
 */
export async function computeImpactForState(
  state_code: string,
  population: number,
  pledges: PledgeImpactInput[],
): Promise<PledgeImpactResponse> {
  const impacts: PledgeImpactRow[] = [];

  for (const p of pledges) {
    const est = await estimatePledgeReduction({
      title: p.title,
      description: p.description,
      category: p.category,
    } as PledgeInputForAI);

    const per = est.per_person_kg_per_year;
    const scenarios = [0.3, 0.5, 1.0].map((rate) => {
      const total_kg = per * population * rate;
      return {
        adoption_rate: rate,
        reduction_mt_total: total_kg / 1e9,
      };
    });

    impacts.push({
      title: p.title,
      per_person_kg_per_year: per,
      confidence: est.confidence,
      rationale: est.rationale,
      scenarios,
    });
  }

  return {
    state_code: state_code.toUpperCase(),
    population,
    impacts,
  };
}
