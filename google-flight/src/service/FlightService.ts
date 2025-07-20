import axios from "axios";
import type { Airport } from "../types/Airport";
import type { AxiosInstance, AxiosError } from "axios";
import type { FlightSearchParams } from "../types/FlightSearchParams";
import type { FlightSearchResponse } from "../types/FlightSearchResponse";

export class FlightApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "FlightApiError";
    this.status = status;
    this.code = code;
  }
}

class FlightApiService {
  private api: AxiosInstance;

  constructor() {
    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;

    this.api = axios.create({
      baseURL: "https://sky-scrapper.p.rapidapi.com",
      headers: {
        "X-RapidAPI-Key": apiKey || "",
        "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com"
      },
      timeout: 30000
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use((config) => {
      console.log(`${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => Promise.reject(this.handleError(error))
    );
  }

  private handleError(error: AxiosError): FlightApiError {
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response) {
      const { status, data } = error.response;
      const message = (data as any)?.message;

      const errorMap: Record<number, { msg: string; code: string }> = {
        401: {
          msg: "Invalid API key - please check your VITE_RAPIDAPI_KEY",
          code: "UNAUTHORIZED"
        },
        403: {
          msg: "API access forbidden - check your subscription",
          code: "FORBIDDEN"
        },
        429: {
          msg: "Rate limit exceeded - wait before retrying",
          code: "RATE_LIMIT"
        },
        500: {
          msg: "Server error - try again later",
          code: "SERVER_ERROR"
        }
      };

      const mapped = errorMap[status];
      if (mapped) {
        return new FlightApiError(mapped.msg, status, mapped.code);
      }

      return new FlightApiError(
        message || `API error: ${status}`,
        status,
        "API_ERROR"
      );
    }

    if (error.request) {
      return new FlightApiError(
        `Network error: ${error.message}. Check your internet connection.`,
        0,
        "NETWORK_ERROR"
      );
    }

    return new FlightApiError(
      `Unexpected error: ${error.message}`,
      0,
      "UNKNOWN_ERROR"
    );
  }

  // Airport Search Methods
  async searchAirports(query: string): Promise<Airport[]> {
    if (!query || query.length < 2) {
      throw new FlightApiError("Query too short", 400, "INVALID_QUERY");
    }

    try {
      const response = await this.api.get("/api/v1/flights/searchAirport", {
        params: { query }
      });

      if (!response.data?.data || !Array.isArray(response.data.data)) {
        throw new FlightApiError("Invalid response", 0, "INVALID_RESPONSE");
      }

      return response.data.data
        .map((airport: any) => this.cleanAirport(airport))
        .filter(Boolean);
    } catch (error) {
      if (error instanceof FlightApiError) throw error;
      throw new FlightApiError("Search failed", 0, "SEARCH_ERROR");
    }
  }

  private cleanAirport(airport: any): Airport | null {
    if (!airport) return null;

    const presentation = airport.presentation || {};
    const navigation = airport.navigation || {};
    const params = navigation.relevantFlightParams || {};

    const iata = airport.skyId || params.skyId || airport.iata || airport.code;
    const skyId = airport.skyId || params.skyId;
    const entityId = params.entityId || airport.entityId;

    let name = presentation.title || navigation.localizedName || airport.name;

    if (!iata || !name || !/^[A-Z]{3}$/.test(iata)) {
      return null;
    }

    name = name.replace(/^,\s*/, "").trim();

    const subtitle = presentation.subtitle || "";
    let city = airport.city || airport.cityName || "";
    let country = airport.country || airport.countryName || "";

    if (subtitle && subtitle.includes(",")) {
      const parts = subtitle.split(",").map((part: string) => part.trim());
      if (parts.length >= 2) {
        city = city || parts[0];
        country = country || parts[1];
      }
    } else if (subtitle && !city && !country) {
      city = city || subtitle;
    }

    return {
      iata: iata.toUpperCase(),
      name: name.trim(),
      city: city.trim(),
      country: country.trim(),
      skyId: skyId,
      entityId: entityId
    };
  }

  // Flight Search Methods
  async searchFlights(
    params: FlightSearchParams
  ): Promise<FlightSearchResponse> {
    this.validateSearchParams(params);

    try {
      const requestParams = this.buildRequestParams(params);
      const response = await this.api.get("/api/v2/flights/searchFlights", {
        params: requestParams
      });

      if (response.data.status === false) {
        throw new FlightApiError(
          response.data.message || "API returned an error",
          response.status,
          "API_ERROR"
        );
      }

      const transformed = this.transformFlights(response.data);

      if (transformed.itineraries.length === 0) {
        const contextStatus = response.data?.data?.context?.status;
        if (contextStatus === "incomplete") {
          throw new FlightApiError(
            "Search timed out. Try different dates or nearby airports.",
            202,
            "SEARCH_INCOMPLETE"
          );
        }
      }

      return transformed;
    } catch (error) {
      if (error instanceof FlightApiError) throw error;
      throw new FlightApiError(
        "Flight search failed. Please try again.",
        0,
        "SEARCH_ERROR"
      );
    }
  }

  private validateSearchParams(params: FlightSearchParams): void {
    if (!params.originSkyId || !params.destinationSkyId || !params.date) {
      throw new FlightApiError(
        "Missing required search parameters.",
        400,
        "INVALID_PARAMS"
      );
    }
  }

  private buildRequestParams(params: FlightSearchParams) {
    return {
      originSkyId: params.originSkyId,
      destinationSkyId: params.destinationSkyId,
      originEntityId: params.originEntityId,
      destinationEntityId: params.destinationEntityId,
      date: params.date,
      returnDate: params.returnDate,
      cabinClass: params.cabinClass || "economy",
      adults: params.adults || 1,
      children: params.children || 0,
      infants: params.infants || 0,
      sortBy: params.sortBy || "price_low",
      currency: params.currency || "USD",
      market: params.market || "US",
      countryCode: params.countryCode || "US"
    };
  }

  // Data Transformation Methods
  private transformFlights(data: any): FlightSearchResponse {
    let itineraries = [];

    if (data?.data?.itineraries && Array.isArray(data.data.itineraries)) {
      itineraries = data.data.itineraries;
    } else if (data?.itineraries && Array.isArray(data.itineraries)) {
      itineraries = data.itineraries;
    } else if (data?.results && Array.isArray(data.results)) {
      itineraries = data.results;
    } else {
      return this.createEmptyResponse(data);
    }

    const transformedItineraries = itineraries
      .map((itinerary: any) => {
        try {
          return this.transformItinerary(itinerary);
        } catch (error) {
          console.warn("Failed to transform itinerary:", error);
          return null;
        }
      })
      .filter(Boolean);

    const validFlights = transformedItineraries.filter(
      (flight: any) => flight && flight.duration > 0 && flight.price.amount > 0
    );

    return {
      itineraries: validFlights,
      status: "success",
      filterStats:
        validFlights.length > 0
          ? this.buildFilterStats(validFlights)
          : this.createEmptyFilterStats(),
      context: {
        totalResults: transformedItineraries.length,
        searchId: data?.searchId || data?.data?.searchId || ""
      }
    };
  }

  private transformItinerary(itinerary: any) {
    if (!this.isValidItinerary(itinerary)) {
      return null;
    }

    const transformedLegs = itinerary.legs.map((leg: any) =>
      this.transformLeg(leg)
    );

    return {
      id: itinerary.id,
      legs: transformedLegs,
      price: {
        amount: itinerary.price.raw || 0,
        currency: itinerary.price.currency || "USD",
        formatted:
          itinerary.price.formatted ||
          `${itinerary.price.raw} ${itinerary.price.currency || "USD"}`
      },
      duration: transformedLegs.reduce(
        (total: number, leg: any) => total + (leg.duration || 0),
        0
      ),
      stops: Math.max(0, transformedLegs.length - 1),
      isDirectFlight: transformedLegs.length === 1,
      deepLink: itinerary.purchaseLinks?.[0]?.url || "",
      agent: {
        name: itinerary.purchaseLinks?.[0]?.providerId || "Unknown",
        isAirline: itinerary.purchaseLinks?.[0]?.isAirline || false
      }
    };
  }

  private isValidItinerary(itinerary: any): boolean {
    return !!(
      itinerary &&
      itinerary.id &&
      itinerary.legs &&
      Array.isArray(itinerary.legs) &&
      itinerary.legs.length > 0 &&
      itinerary.price &&
      typeof itinerary.price.raw === "number"
    );
  }

  private transformLeg(leg: any) {
    if (!leg?.origin || !leg?.destination || !leg?.departure || !leg?.arrival) {
      throw new Error("Missing required leg data");
    }

    return {
      id:
        leg.id ||
        `${leg.origin?.id || "unknown"}-${leg.destination?.id || "unknown"}`,
      origin: {
        iata: leg.origin.id || "",
        name: leg.origin.name || "",
        city: leg.origin.city || "",
        country: leg.origin.country || ""
      },
      destination: {
        iata: leg.destination.id || "",
        name: leg.destination.name || "",
        city: leg.destination.city || "",
        country: leg.destination.country || ""
      },
      departure: leg.departure,
      arrival: leg.arrival,
      duration: leg.durationInMinutes || 0,
      airline: {
        name: leg.carriers?.marketing?.[0]?.name || "Unknown",
        logo: leg.carriers?.marketing?.[0]?.logoUrl || "",
        iata: leg.carriers?.marketing?.[0]?.iata || ""
      },
      aircraft: leg.operatingCarrier?.name || "Unknown",
      flightNumber: leg.flightNumber || ""
    };
  }

  private buildFilterStats(flights: any[]) {
    if (!flights || flights.length === 0) {
      return this.createEmptyFilterStats();
    }

    const durations = flights.map((f) => f.duration).filter((d) => d > 0);
    const prices = flights.map((f) => f.price.amount).filter((p) => p > 0);
    const airlines = [
      ...new Set(
        flights.flatMap((f) =>
          f.legs
            .map((l: any) => l.airline.name)
            .filter((name: string) => name !== "Unknown" && name)
        )
      )
    ];
    const stops = [...new Set(flights.map((f) => f.stops))];

    return {
      duration:
        durations.length > 0
          ? { min: Math.min(...durations), max: Math.max(...durations) }
          : { min: 0, max: 0 },
      price:
        prices.length > 0
          ? { min: Math.min(...prices), max: Math.max(...prices) }
          : { min: 0, max: 0 },
      airlines,
      stops
    };
  }

  private createEmptyResponse(data: any): FlightSearchResponse {
    return {
      itineraries: [],
      status: "success",
      filterStats: this.createEmptyFilterStats(),
      context: {
        totalResults: 0,
        searchId: data?.searchId || ""
      }
    };
  }

  private createEmptyFilterStats() {
    return {
      duration: { min: 0, max: 0 },
      price: { min: 0, max: 0 },
      airlines: [],
      stops: []
    };
  }

  // Utility Methods
  async getPopularDestinations(): Promise<Airport[]> {
    return [
      {
        iata: "LAX",
        name: "Los Angeles International",
        city: "Los Angeles",
        country: "US"
      },
      {
        iata: "JFK",
        name: "John F. Kennedy International",
        city: "New York",
        country: "US"
      },
      { iata: "LHR", name: "London Heathrow", city: "London", country: "UK" },
      { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "FR" },
      {
        iata: "NRT",
        name: "Narita International",
        city: "Tokyo",
        country: "JP"
      },
      {
        iata: "DXB",
        name: "Dubai International",
        city: "Dubai",
        country: "AE"
      },
      {
        iata: "SIN",
        name: "Singapore Changi",
        city: "Singapore",
        country: "SG"
      },
      {
        iata: "FRA",
        name: "Frankfurt am Main",
        city: "Frankfurt",
        country: "DE"
      }
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.searchAirports("test");
      return true;
    } catch (error) {
      return !(
        error instanceof FlightApiError && error.code === "UNAUTHORIZED"
      );
    }
  }
  async healthCheck() {
    try {
      await this.getPopularDestinations();
      return { status: "healthy", timestamp: new Date().toISOString() };
    } catch {
      return { status: "unhealthy", timestamp: new Date().toISOString() };
    }
  }
}
export const flightApi = new FlightApiService();
export { FlightApiService };
