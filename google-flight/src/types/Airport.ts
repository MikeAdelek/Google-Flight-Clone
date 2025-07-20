export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  skyId?: string; // API compatibility
  entityId?: string; // API compatibility
}
