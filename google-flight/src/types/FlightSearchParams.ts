export interface FlightSearchParams {
  originSkyId: string;
  destinationSkyId: string;
  originEntityId?: string;
  destinationEntityId?: string;
  date: string;
  returnDate?: string;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  adults: number;
  children?: number;
  infants?: number;
  sortBy?: "price_low" | "duration" | "departure";
  currency?: string;
  market?: string;
  countryCode?: string;
}

// export interface FlightSearchParams {
//   originSkyId: string;
//   destinationSkyId: string;
//   date: string;
//   returnDate?: string;
//   adults?: number;
//   cabinClass?: string;
// }
