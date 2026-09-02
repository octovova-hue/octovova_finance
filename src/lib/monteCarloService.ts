/**
 * monteCarloService.ts
 * --------------------
 * Client service to fetch empirical Nifty50 Monte Carlo simulations (10,000 runs)
 * from the Hugging Face static simulation engine with fallback support.
 */

export interface MonteCarloPercentiles {
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface MonteCarloSimulationData {
  horizon: string;
  horizonYears: number;
  n_simulations: number;
  mean_cagr_pct: number;
  median_cagr_pct: number;
  std_dev_pct: number;
  percentiles: MonteCarloPercentiles;
  prob_negative_cagr_pct: number;
  prob_below_6pct: number;
  prob_10_to_14pct: number;
  prob_above_14pct: number;
  goal_success_probability: number;
  source: 'hf_space' | 'cached' | 'fallback';
}

const AVAILABLE_HORIZONS = [1, 3, 5, 10, 15, 20];
const simulationCache = new Map<number, MonteCarloSimulationData>();

export function snapHorizon(years: number): number {
  return AVAILABLE_HORIZONS.reduce((prev, curr) =>
    Math.abs(curr - years) < Math.abs(prev - years) ? curr : prev
  );
}

/**
 * Derives goal success probability given the simulated distribution percentiles and plan expected CAGR.
 */
export function deriveSuccessProbability(
  percentiles: MonteCarloPercentiles,
  planCagrPct: number
): number {
  // If plan requires less return than 10th percentile, probability is >= 90%
  if (planCagrPct <= percentiles.p10) {
    const diff = Math.max(0, (percentiles.p10 - planCagrPct) / 5);
    return Math.min(99.0, +(90.0 + diff * 5).toFixed(1));
  }
  if (planCagrPct <= percentiles.p25) {
    const ratio = (planCagrPct - percentiles.p10) / (percentiles.p25 - percentiles.p10 || 1);
    return +(90.0 - ratio * 15.0).toFixed(1);
  }
  if (planCagrPct <= percentiles.p50) {
    const ratio = (planCagrPct - percentiles.p25) / (percentiles.p50 - percentiles.p25 || 1);
    return +(75.0 - ratio * 25.0).toFixed(1);
  }
  if (planCagrPct <= percentiles.p75) {
    const ratio = (planCagrPct - percentiles.p50) / (percentiles.p75 - percentiles.p50 || 1);
    return +(50.0 - ratio * 25.0).toFixed(1);
  }
  if (planCagrPct <= percentiles.p90) {
    const ratio = (planCagrPct - percentiles.p75) / (percentiles.p90 - percentiles.p75 || 1);
    return +(25.0 - ratio * 15.0).toFixed(1);
  }
  const ratio = Math.min(1.0, (planCagrPct - percentiles.p90) / (percentiles.p95 - percentiles.p90 || 1));
  return Math.max(5.0, +(10.0 - ratio * 5.0).toFixed(1));
}

export function getFallbackMonteCarlo(horizon: number, planCagrPct: number = 10.0): MonteCarloSimulationData {
  const percentiles: MonteCarloPercentiles = {
    p5: horizon >= 5 ? 1.5 : -12.0,
    p10: horizon >= 5 ? 4.0 : -6.0,
    p25: horizon >= 5 ? 8.2 : 2.0,
    p50: horizon >= 5 ? 12.0 : 10.5,
    p75: horizon >= 5 ? 16.5 : 18.0,
    p90: horizon >= 5 ? 21.0 : 25.0,
    p95: horizon >= 5 ? 25.0 : 30.0,
  };

  const prob = deriveSuccessProbability(percentiles, planCagrPct);

  return {
    horizon: `${horizon}yr`,
    horizonYears: horizon,
    n_simulations: 10000,
    mean_cagr_pct: 12.2,
    median_cagr_pct: 11.8,
    std_dev_pct: 10.5,
    percentiles,
    prob_negative_cagr_pct: horizon >= 5 ? 3.5 : 18.0,
    prob_below_6pct: horizon >= 5 ? 12.0 : 35.0,
    prob_10_to_14pct: 22.0,
    prob_above_14pct: 38.0,
    goal_success_probability: prob,
    source: 'fallback',
  };
}

export async function fetchMonteCarloSimulation(
  horizonYears: number,
  planCagrPct: number = 10.0
): Promise<MonteCarloSimulationData> {
  const horizon = snapHorizon(horizonYears);

  if (simulationCache.has(horizon)) {
    const cached = simulationCache.get(horizon)!;
    const prob = deriveSuccessProbability(cached.percentiles, planCagrPct);
    return { ...cached, goal_success_probability: prob, source: 'cached' };
  }

  const baseUrl =
    import.meta.env.VITE_HF_MONTE_CARLO_URL ||
    'https://octovova-nifty50-monte-carlo-api.static.hf.space';
  const apiToken = import.meta.env.VITE_HF_API_TOKEN;

  const url = `${baseUrl.replace(/\/$/, '')}/api/simulation/horizon/${horizon}.json`;
  const headers: Record<string, string> = {};
  if (apiToken && apiToken.trim().length > 0) {
    headers['Authorization'] = `Bearer ${apiToken.trim()}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HF Space returned status ${response.status}`);
    }
    const data = await response.json();
    const prob = deriveSuccessProbability(data.percentiles, planCagrPct);
    const result: MonteCarloSimulationData = {
      horizon: data.horizon || `${horizon}yr`,
      horizonYears: horizon,
      n_simulations: data.n_simulations || 10000,
      mean_cagr_pct: data.mean_cagr_pct,
      median_cagr_pct: data.median_cagr_pct,
      std_dev_pct: data.std_dev_pct,
      percentiles: data.percentiles,
      prob_negative_cagr_pct: data.prob_negative_cagr_pct,
      prob_below_6pct: data.prob_below_6pct,
      prob_10_to_14pct: data.prob_10_to_14pct,
      prob_above_14pct: data.prob_above_14pct,
      goal_success_probability: prob,
      source: 'hf_space',
    };
    simulationCache.set(horizon, result);
    return result;
  } catch (error) {
    console.warn(`[MonteCarloService] HF Space unavailable for horizon ${horizon}yr, using fallback:`, error);
    const fallback = getFallbackMonteCarlo(horizon, planCagrPct);
    return fallback;
  }
}
