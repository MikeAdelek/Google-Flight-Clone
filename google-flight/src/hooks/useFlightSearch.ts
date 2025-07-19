import { useState, useCallback } from "react";
import { flightApi } from "../service/FlightService";
import type { FlightSearchParams } from "../types/FlightSearchParams";
import type { FlightSearchResponse } from "../types/FlightSearchResponse";

interface UseFlightSearchReturn {
  searchResults: FlightSearchResponse | null;
  isLoading: boolean;
  error: string | null;
  searchFlights: (params: FlightSearchParams) => Promise<void>;
  clearResults: () => void;
}

export const useFlightSearch = (): UseFlightSearchReturn => {
  const [searchResults, setSearchResults] =
    useState<FlightSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = useCallback(async (params: FlightSearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await flightApi.searchFlights(params);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occured");
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    clearResults,
    searchResults,
    searchFlights
  };
};
