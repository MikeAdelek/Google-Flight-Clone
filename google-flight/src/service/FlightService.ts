import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";
import type { Airport } from "../types/Airport";
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
    this.api = axios.create({
      baseURL: "https://sky-scrapper.p.rapidapi.com",
      headers: {
        "X-RapidAPI-Key": import.meta.env.VITE_RAPIDAPI_KEY || "",
        "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com"
      },
      timeout: 30000
    });

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
    if (error.response) {
      const { status, data } = error.response;
      const message = (data as any)?.message;

      const errorMap: Record<number, { msg: string; code: string }> = {
        401: { msg: "Invalid API key", code: "UNAUTHORIZED" },
        403: { msg: "API access forbidden", code: "FORBIDDEN" },
        429: { msg: "Rate limit exceeded", code: "RATE_LIMIT" },
        500: { msg: "Server error", code: "SERVER_ERROR" }
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
      return new FlightApiError("Network error", 0, "NETWORK_ERROR");
    }

    return new FlightApiError("Unexpected error", 0, "UNKNOWN_ERROR");
  }

  private cleanAirport(airport: any): Airport | null {
    if (!airport) return null;

    const presentation = airport.presentation || {};
    const navigation = airport.navigation || {};
    const params = navigation.relevantFlightParams || {};

    const iata = airport.skyId || params.skyId || airport.iata || airport.code;
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
      country: country.trim()
    };
  }

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

      const airports = response.data.data
        .map((airport: any) => {
          const cleaned = this.cleanAirport(airport);
          if (!cleaned) {
            console.log("Skipped airport:", {
              skyId: airport.skyId,
              title: airport.presentation?.title,
              subtitle: airport.presentation?.subtitle,
              localizedName: airport.navigation?.localizedName
            });
          }
          return cleaned;
        })
        .filter(Boolean);

      if (airports.length === 0 && response.data.data.length > 0) {
        console.warn("No valid airports found in response");
        console.log(
          "Sample raw data:",
          JSON.stringify(response.data.data[0], null, 2)
        );
      }

      return airports;
    } catch (error) {
      if (error instanceof FlightApiError) throw error;
      throw new FlightApiError("Search failed", 0, "SEARCH_ERROR");
    }
  }

  private async retrySearchWithAlternatives(
    params: FlightSearchParams
  ): Promise<FlightSearchResponse> {
    const alternatives = [
      {
        ...params,
        originEntityId: params.originSkyId + "ENTY",
        destinationEntityId: params.destinationSkyId + "ENTY"
      },
      {
        ...params,
        originEntityId: undefined,
        destinationEntityId: undefined
      },
      {
        ...params,
        date: this.adjustDate(params.date)
      }
    ];

    for (const altParams of alternatives) {
      try {
        console.log("Retrying with alternative params:", altParams);
        const response = await this.api.get("/api/v2/flights/searchFlights", {
          params: {
            originSkyId: altParams.originSkyId,
            destinationSkyId: altParams.destinationSkyId,
            originEntityId: altParams.originEntityId,
            destinationEntityId: altParams.destinationEntityId,
            date: altParams.date,
            returnDate: altParams.returnDate,
            cabinClass: altParams.cabinClass || "economy",
            adults: altParams.adults || 1,
            children: altParams.children || 0,
            infants: altParams.infants || 0,
            sortBy: altParams.sortBy || "price_low",
            currency: altParams.currency || "USD",
            market: altParams.market || "US",
            countryCode: altParams.countryCode || "US"
          }
        });

        const transformed = this.transformFlights(response.data);
        if (transformed.itineraries.length > 0) {
          console.log("Alternative search successful!");
          return transformed;
        }
      } catch (error) {
        console.log("Alternative search failed, trying next...");
        continue;
      }
    }

    throw new FlightApiError(
      "We couldn't find any flights for your search. This might be because flights aren't available for your selected route or dates. Try searching for a different date or nearby airports.",
      404,
      "NO_FLIGHTS_FOUND"
    );
  }

  private adjustDate(dateStr: string): string {
    const date = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date < tomorrow) {
      tomorrow.setDate(tomorrow.getDate() + 7);
      return tomorrow.toISOString().split("T")[0];
    }

    return dateStr;
  }

  async searchFlights(
    params: FlightSearchParams
  ): Promise<FlightSearchResponse> {
    if (!params.originSkyId || !params.destinationSkyId || !params.date) {
      throw new FlightApiError(
        "Missing required search parameters. Please make sure you've selected both airports and a departure date.",
        400,
        "INVALID_PARAMS"
      );
    }

    const searchDate = new Date(params.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (searchDate < today) {
      throw new FlightApiError(
        "Please select a departure date that's today or in the future.",
        400,
        "INVALID_DATE"
      );
    }

    return this.performSearchWithRetry(params);
  }

  private async performSearchWithRetry(
    params: FlightSearchParams,
    attempt: number = 1,
    maxAttempts: number = 3
  ): Promise<FlightSearchResponse> {
    try {
      console.log(`Flight search attempt ${attempt}:`, params);

      const response = await this.api.get("/api/v2/flights/searchFlights", {
        params: {
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
        }
      });

      console.log("API Response Status:", response.status);

      if (response.data?.status === false) {
        console.log("API returned error status:", response.data.message);
        throw new FlightApiError(
          "No flights available for this route",
          404,
          "NO_FLIGHTS_FOUND"
        );
      }

      const contextStatus = response.data?.data?.context?.status;
      const itinerariesLength = response.data?.data?.itineraries?.length || 0;

      console.log("API Response Structure:", {
        hasData: !!response.data,
        status: response.data?.status,
        contextStatus,
        hasItineraries: !!response.data?.data?.itineraries,
        itinerariesLength
      });

      // If search is incomplete and we have attempts left, wait and retry
      if (
        contextStatus === "incomplete" &&
        itinerariesLength === 0 &&
        attempt < maxAttempts
      ) {
        console.log(
          `Search incomplete, retrying in ${attempt * 2} seconds... (attempt ${
            attempt + 1
          }/${maxAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000)); // Wait 2, 4, 6 seconds
        return this.performSearchWithRetry(params, attempt + 1, maxAttempts);
      }

      const transformed = this.transformFlights(response.data);

      // If we still have no results after retries
      if (transformed.itineraries.length === 0) {
        if (contextStatus === "incomplete") {
          throw new FlightApiError(
            "The flight search is taking longer than expected. This usually happens when there are limited flight options for your route. Try searching for nearby dates or different airports.",
            202,
            "SEARCH_INCOMPLETE"
          );
        }

        // Try alternative search parameters as last resort
        console.log("No flights found, trying alternatives...");
        return await this.retrySearchWithAlternatives(params);
      }

      return transformed;
    } catch (error) {
      console.error("Flight search error:", error);
      if (error instanceof FlightApiError) throw error;

      // Try alternatives for network/API errors
      try {
        return await this.retrySearchWithAlternatives(params);
      } catch (retryError) {
        if (retryError instanceof FlightApiError) throw retryError;
        throw new FlightApiError(
          "We're having trouble connecting to our flight database. Please check your internet connection and try again.",
          0,
          "SEARCH_ERROR"
        );
      }
    }
  }

  private transformFlights(data: any): FlightSearchResponse {
    console.log("Transforming flights data:", {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasDataData: !!data?.data,
      dataDataKeys: data?.data ? Object.keys(data.data) : [],
      hasItineraries: !!data?.data?.itineraries,
      itinerariesType: typeof data?.data?.itineraries,
      itinerariesLength: Array.isArray(data?.data?.itineraries)
        ? data.data.itineraries.length
        : "not array"
    });

    // Handle API error responses
    if (data?.status === false) {
      console.log("API returned error status, no flights to transform");
      return {
        itineraries: [],
        status: "success",
        filterStats: {
          duration: { min: 0, max: 0 },
          price: { min: 0, max: 0 },
          airlines: [],
          stops: []
        },
        context: {
          totalResults: 0,
          searchId: data?.searchId || ""
        }
      };
    }

    let itineraries = [];

    if (data?.data?.itineraries && Array.isArray(data.data.itineraries)) {
      itineraries = data.data.itineraries;
    } else if (data?.itineraries && Array.isArray(data.itineraries)) {
      itineraries = data.itineraries;
    } else if (data?.results && Array.isArray(data.results)) {
      itineraries = data.results;
    } else {
      console.error("No itineraries found in response structure:", data);
      return {
        itineraries: [],
        status: "success",
        filterStats: {
          duration: { min: 0, max: 0 },
          price: { min: 0, max: 0 },
          airlines: [],
          stops: []
        },
        context: {
          totalResults: 0,
          searchId: data?.searchId || ""
        }
      };
    }

    const transformedItineraries = itineraries
      .map((itinerary: any) => {
        try {
          return this.transformItinerary(itinerary);
        } catch (error) {
          console.warn("Failed to transform itinerary:", error);
          // Log the problematic itinerary to help debug
          console.log(
            "Problematic itinerary structure:",
            JSON.stringify(itinerary, null, 2)
          );
          return null;
        }
      })
      .filter(Boolean);

    // Be less strict with validation - don't filter out flights with 0 duration or price initially
    const validFlights = transformedItineraries.filter((flight: any) => flight);

    console.log(
      `Transformed ${transformedItineraries.length} itineraries, ${validFlights.length} valid flights`
    );

    return {
      itineraries: validFlights,
      status: "success",
      filterStats:
        validFlights.length > 0
          ? this.buildFilterStats(validFlights)
          : {
              duration: { min: 0, max: 0 },
              price: { min: 0, max: 0 },
              airlines: [],
              stops: []
            },
      context: {
        totalResults: transformedItineraries.length,
        searchId: data?.searchId || data?.data?.searchId || ""
      }
    };
  }

  private transformItinerary(itinerary: any) {
    if (!itinerary) {
      console.warn("Empty itinerary provided");
      return null;
    }

    if (!itinerary.id) {
      console.warn("Itinerary missing id, using fallback");
      // Create a fallback ID instead of returning null
      itinerary.id = `flight-${Date.now()}-${Math.random()}`;
    }

    if (
      !itinerary.legs ||
      !Array.isArray(itinerary.legs) ||
      itinerary.legs.length === 0
    ) {
      console.warn("Itinerary missing or invalid legs:", itinerary);
      return null;
    }

    // Be more flexible with price validation
    if (!itinerary.price) {
      console.warn("Itinerary missing price, setting to 0");
      itinerary.price = {
        raw: 0,
        currency: "USD",
        formatted: "Price unavailable"
      };
    }

    try {
      const transformedLegs = itinerary.legs.map((leg: any, index: number) => {
        try {
          return this.transformLeg(leg, index);
        } catch (error) {
          console.warn("Failed to transform leg:", error, leg);
          throw error;
        }
      });

      return {
        id: itinerary.id,
        legs: transformedLegs,
        price: {
          amount: itinerary.price?.raw || 0,
          currency: itinerary.price?.currency || "USD",
          formatted:
            itinerary.price?.formatted ||
            `${itinerary.price?.raw || 0} ${itinerary.price?.currency || "USD"}`
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
    } catch (error) {
      console.warn("Failed to transform itinerary:", error);
      return null;
    }
  }

  private transformLeg(leg: any, index: number = 0) {
    if (!leg) {
      throw new Error("Empty leg data");
    }

    // Create fallbacks for missing data instead of throwing errors
    const origin = leg.origin || {};
    const destination = leg.destination || {};

    if (!origin.id && !destination.id) {
      console.error("Leg missing both origin and destination IDs:", leg);
      throw new Error("Missing leg data");
    }

    return {
      id: leg.id || `leg-${index}-${Date.now()}`,
      origin: {
        iata: origin.id || "",
        name: origin.name || "",
        city: origin.city || "",
        country: origin.country || ""
      },
      destination: {
        iata: destination.id || "",
        name: destination.name || "",
        city: destination.city || "",
        country: destination.country || ""
      },
      departure: leg.departure || "",
      arrival: leg.arrival || "",
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
      return {
        duration: { min: 0, max: 0 },
        price: { min: 0, max: 0 },
        airlines: [],
        stops: []
      };
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
