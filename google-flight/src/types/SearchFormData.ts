import type { Airport } from "./Airport";

export interface SearchFormData {
  tripType: "round-trip" | "one-way" | "multi-city";
  from: Airport | null;
  to: Airport | null;
  departDate: string;
  returnDate: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: "economy" | "premium_economy" | "business" | "first";
}
