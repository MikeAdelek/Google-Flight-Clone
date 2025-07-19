import React, { useState } from "react";
import { useFlightContext } from "../context/FlightContext";
import { flightApi, FlightApiError } from "../service/FlightService";
import { AirportSelector } from "./AirportSelector";

const SearchForm: React.FC = () => {
  const { state, updateSearchForm, dispatch } = useFlightContext();
  const { searchFormData } = state;
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [searchAttempts, setSearchAttempts] = useState(0);

  const getErrorMessage = (error: FlightApiError): string => {
    const messages: Record<string, string> = {
      NO_FLIGHTS_FOUND:
        "No flights found. Try different dates or nearby airports.",
      SEARCH_INCOMPLETE: "Search timed out. The route might have limited options - try different dates.",
      INVALID_DATE: "Please select a valid departure date.",
      INVALID_PARAMS: "Please fill in all required fields.",
      UNAUTHORIZED: "Service temporarily unavailable. Please try again.",
      RATE_LIMIT: "Too many searches. Please wait a moment.",
      NETWORK_ERROR: "Connection problem. Check your internet and retry."
    };

    return (
      messages[error.code as keyof typeof messages] ||
      `Search failed: ${error.message}`
    );
  };

  const validateForm = (): string | null => {
    const { from, to, departDate, returnDate, tripType } = searchFormData;

    if (!from) return "Please select departure airport.";
    if (!to) return "Please select destination airport.";
    if (from.iata === to.iata)
      return "Departure and destination must be different.";
    if (!departDate) return "Please select departure date.";

    if (tripType === "round-trip") {
      if (!returnDate) return "Please select return date.";
      if (new Date(returnDate) < new Date(departDate)) {
        return "Return date must be after departure date.";
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(departDate) < today) {
      return "Departure date cannot be in the past.";
    }

    return null;
  };

  const getSuggestions = () => {
    const suggestions = [];

    if (searchAttempts > 0) {
      suggestions.push("Try different dates (±3 days)");
      suggestions.push("Check nearby airports");
      suggestions.push("This route might need connecting flights");
    }

    if (searchFormData.cabinClass !== "economy") {
      suggestions.push("Try Economy class for more options");
    }

    return suggestions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      dispatch({ type: "SET_ERROR", payload: error });
      return;
    }

    const params = {
      originSkyId: searchFormData.from!.iata,
      destinationSkyId: searchFormData.to!.iata,
      originEntityId: searchFormData.from!.iata,
      destinationEntityId: searchFormData.to!.iata,
      date: searchFormData.departDate,
      returnDate:
        searchFormData.tripType === "round-trip"
          ? searchFormData.returnDate
          : undefined,
      cabinClass: searchFormData.cabinClass,
      adults: searchFormData.passengers.adults,
      children: searchFormData.passengers.children,
      infants: searchFormData.passengers.infants,
      sortBy: "price_low" as const,
      currency: "USD",
      market: "US",
      countryCode: "US"
    };

    try {
      setIsSearching(true);
      setSearchStatus("Searching for flights...");
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: "" });

      // Add a timeout to update status if search is taking long
      const statusTimeout = setTimeout(() => {
        setSearchStatus("This is taking a bit longer than usual... Please wait");
      }, 8000);

      const results = await flightApi.searchFlights(params);
      clearTimeout(statusTimeout);

      if (results.itineraries.length === 0) {
        const suggestions = getSuggestions();
        let message = "No flights found for your search.";

        if (suggestions.length > 0) {
          message += `\n\nTry:\n• ${suggestions.join("\n• ")}`;
        }

        dispatch({ type: "SET_ERROR", payload: message });
        setSearchAttempts((prev) => prev + 1);
      } else {
        dispatch({ type: "SET_SEARCH_RESULTS", payload: results });
        setSearchAttempts(0);
        setSearchStatus("");
      }
    } catch (error) {
      let errorMessage = "Something went wrong. Please try again.";

      if (error instanceof FlightApiError) {
        errorMessage = getErrorMessage(error);
        
        // For incomplete searches, give more specific advice
        if (error.code === "SEARCH_INCOMPLETE") {
          errorMessage += "\n\nThis route may have limited availability. Consider:\n• Flying on weekdays\n• Checking nearby airports\n• Booking further in advance";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const suggestions = getSuggestions();
      if (suggestions.length > 0 && error instanceof FlightApiError && error.code !== "SEARCH_INCOMPLETE") {
        errorMessage += `\n\nSuggestions:\n• ${suggestions.join("\n• ")}`;
      }

      dispatch({ type: "SET_ERROR", payload: errorMessage });
      setSearchAttempts((prev) => prev + 1);
    } finally {
      setIsSearching(false);
      setSearchStatus("");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Type */}
        <div className="flex space-x-4">
          {[
            { value: "round-trip", label: "Round trip" },
            { value: "one-way", label: "One way" },
            { value: "multi-city", label: "Multi-city" }
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value={value}
                checked={searchFormData.tripType === value}
                onChange={(e) =>
                  updateSearchForm({ tripType: e.target.value as any })
                }
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* Airports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AirportSelector
            label="From"
            value={searchFormData.from}
            onChange={(airport) => updateSearchForm({ from: airport })}
            placeholder="Departure city"
          />
          <AirportSelector
            label="To"
            value={searchFormData.to}
            onChange={(airport) => updateSearchForm({ to: airport })}
            placeholder="Destination city"
          />
        </div>

        {/* Same airport warning */}
        {searchFormData.from &&
          searchFormData.to &&
          searchFormData.from.iata === searchFormData.to.iata && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded">
              <p className="text-sm">
                Please select different departure and destination airports.
              </p>
            </div>
          )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="departDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Departure
            </label>
            <input
              id="departDate"
              type="date"
              min={today}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchFormData.departDate}
              onChange={(e) => updateSearchForm({ departDate: e.target.value })}
            />
          </div>

          {searchFormData.tripType === "round-trip" && (
            <div>
              <label
                htmlFor="returnDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Return
              </label>
              <input
                id="returnDate"
                type="date"
                min={searchFormData.departDate || today}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchFormData.returnDate || ""}
                onChange={(e) =>
                  updateSearchForm({ returnDate: e.target.value })
                }
              />
            </div>
          )}
        </div>

        {/* Passengers and Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passengers
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "adults" as const, label: "Adults", min: 1 },
                { key: "children" as const, label: "Children", min: 0 },
                { key: "infants" as const, label: "Infants", min: 0 }
              ].map(({ key, label, min }) => (
                <div key={key}>
                  <label
                    htmlFor={key}
                    className="block text-xs text-gray-600 mb-1"
                  >
                    {label}
                  </label>
                  <input
                    id={key}
                    type="number"
                    min={min}
                    max="9"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    value={searchFormData.passengers[key]}
                    onChange={(e) =>
                      updateSearchForm({
                        passengers: {
                          ...searchFormData.passengers,
                          [key]: parseInt(e.target.value) || min
                        }
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="cabinClass"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Class
            </label>
            <select
              id="cabinClass"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchFormData.cabinClass}
              onChange={(e) =>
                updateSearchForm({ cabinClass: e.target.value as any })
              }
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>

        {/* Search Status */}
        {isSearching && searchStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-sm">{searchStatus}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSearching}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-lg"
        >
          {isSearching ? "Searching..." : "Search Flights"}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;