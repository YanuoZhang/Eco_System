import { useState, useEffect, useRef } from "react";
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
  const isMountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchNews = async () => {
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      const response = await apiService.getClimateNews();

      if (response.success) {
        if (!isMountedRef.current) return;
        setNews(response.data);
        setLastUpdated(response.lastUpdated);
      } else {
        throw new Error("Failed to fetch news");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      console.error("Error fetching climate news:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchNews();
    return () => {
      isMountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    news,
    loading,
    error,
    refetch: fetchNews,
    lastUpdated,
  };
}
