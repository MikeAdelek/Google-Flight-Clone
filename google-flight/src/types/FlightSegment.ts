import type { Airport } from "./Airport";

export interface FlightSegment {
  id: string;
  origin: Airport;
  destination: Airport;
  departure: string;
  arrival: string;
  duration: number;
  airline: {
    name: string;
    logo: string;
    iata: string;
  };
  aircraft: string;
  flightNumber: string;
}
