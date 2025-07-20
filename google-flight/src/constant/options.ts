// Trip type options
export const tripTypeOptions = [
  { value: "round-trip", label: "Round trip" },
  { value: "one-way", label: "One way" },
  { value: "multi-city", label: "Multi-city" }
];

// Passenger types
export const passengerTypes = [
  { key: "adults" as const, label: "Adults", min: 1 },
  { key: "children" as const, label: "Children", min: 0 },
  { key: "infants" as const, label: "Infants", min: 0 }
];

// Cabin class options
export const cabinClassOptions = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" }
];
