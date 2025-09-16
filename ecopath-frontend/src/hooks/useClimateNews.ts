import { useState, useEffect } from "react";
import { apiService, NewsItem } from "@/services/api";

interface UseClimateNewsReturn {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: string | null;
}

export function useClimateNews(): UseClimateNewsReturn {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getClimateNews();

      if (response.success) {
        setNews(response.data);
        setLastUpdated(response.lastUpdated);
      } else {
        throw new Error("Failed to fetch news");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching climate news:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return {
    news,
    loading,
    error,
    refetch: fetchNews,
    lastUpdated,
  };
}
