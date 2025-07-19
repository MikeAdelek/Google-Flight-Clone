import type { FlightSegment } from "./FlightSegment";

export interface FlightItinerary {
  id: string;
  legs: FlightSegment[];
  price: {
    amount: number;
    currency: string;
    formatted: string;
  };
  duration: number;
  stops: number;
  isDirectFlight: boolean;
  deepLink: string;
  agent: {
    name: string;
    isAirline: boolean;
  };
}
