import { useState, useCallback } from "react";
import type { Airport } from "../types/Airport";
import { flightApi } from "../service/FlightService";

interface UseAirportSearchReturn {
  airports: Airport[];
  isLoading: boolean;
  error: string | null;
  searchAirports: (query: string) => Promise<void>;
  clearAirports: () => void;
}
export const useAirportSearch = (): UseAirportSearchReturn => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAirports = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAirports([]);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const results = await flightApi.searchAirports(query);
      setAirports(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search airports"
      );
      setAirports([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAirports = useCallback(() => {
    setAirports([]);
    setError(null);
  }, []);

  return {
    airports,
    isLoading,
    error,
    searchAirports,
    clearAirports: clearAirports
  };
};
