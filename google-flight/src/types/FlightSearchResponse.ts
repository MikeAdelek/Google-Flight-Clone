import type { FlightItinerary } from "./FlightItinerary";

export interface FlightSearchResponse {
  itineraries: FlightItinerary[];
  status: "success" | "error" | "loading";
  filterStats: {
    duration: { min: number; max: number };
    price: { min: number; max: number };
    airlines: string[];
    stops: number[];
  };
  context: {
    totalResults: number;
    searchId: string;
  };
}
