// Prediction cache service for ML predictions
import axios from "axios";

interface PredictionRecord {
  state_id: string;
  year: number;
  predicted_emission_mt: number;
}

interface CacheData {
  predictions: PredictionRecord[];
  lastUpdated: Date;
}

class PredictionCache {
  private cache: CacheData | null = null;
  private readonly ML_SERVICE_URL = "http://127.0.0.1:8001/predict";
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  async getPredictions(): Promise<PredictionRecord[]> {
    // Check if cache is valid
    if (this.cache && this.isCacheValid()) {
      console.log("✅ Using cached ML predictions");
      return this.cache.predictions;
    }

    // Fetch new predictions
    console.log("🔄 Fetching fresh ML predictions...");
    try {
      const response = await axios.post(this.ML_SERVICE_URL);
      const predictions = response.data?.predictions || [];

      this.cache = {
        predictions,
        lastUpdated: new Date(),
      };

      console.log(`✅ Cached ${predictions.length} predictions`);
      return predictions;
    } catch (error) {
      console.error("❌ Failed to fetch ML predictions:", error);
      // Return cached data if available, even if expired
      if (this.cache) {
        console.log("⚠️  Using stale cache due to error");
        return this.cache.predictions;
      }
      throw error;
    }
  }

  async getPredictionsForState(stateCode: string): Promise<PredictionRecord[]> {
    const allPredictions = await this.getPredictions();
    return allPredictions.filter((p) => p.state_id === stateCode.toUpperCase());
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const age = Date.now() - this.cache.lastUpdated.getTime();
    return age < this.CACHE_TTL;
  }

  // Force refresh cache
  async refresh(): Promise<void> {
    this.cache = null;
    await this.getPredictions();
  }

  // Warm up cache on startup
  async warmUp(): Promise<void> {
    console.log("🔥 Warming up prediction cache...");
    await this.getPredictions();
  }
}

export const predictionCache = new PredictionCache();
