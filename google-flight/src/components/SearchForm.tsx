import React, { useState } from "react";
import { AirportSelector } from "./AirportSelector";
import { useFlightContext } from "../context/FlightContext";
import { getErrorMessage } from "../constant/ErrorMessages";
import { flightApi, FlightApiError } from "../service/FlightService";
import type { FlightSearchParams } from "../types/FlightSearchParams";
import {
  tripTypeOptions,
  passengerTypes,
  cabinClassOptions
} from "../constant/options";

const SearchForm: React.FC = () => {
  const { state, updateSearchForm, dispatch } = useFlightContext();
  const { searchFormData } = state;

  // Local state
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [searchAttempts, setSearchAttempts] = useState(0);

  // Form validation 
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

  // Search suggestions
  const getSuggestions = (): string[] => {
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

  // Build search parameters
  const buildSearchParams = (): FlightSearchParams => ({
    originSkyId: searchFormData.from?.skyId || searchFormData.from?.iata || "",
    destinationSkyId: searchFormData.to?.skyId || searchFormData.to?.iata || "",
    originEntityId: searchFormData.from?.entityId,
    destinationEntityId: searchFormData.to?.entityId,
    date: searchFormData.departDate,
    returnDate:
      searchFormData.tripType === "round-trip"
        ? searchFormData.returnDate
        : undefined,
    cabinClass: searchFormData.cabinClass,
    adults: searchFormData.passengers.adults,
    children: searchFormData.passengers.children,
    infants: searchFormData.passengers.infants,
    currency: "USD",
    market: "US",
    countryCode: "US"
  });

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      dispatch({ type: "SET_ERROR", payload: validationError });
      return;
    }

    const searchParams = buildSearchParams();

    try {
      // Set loading state
      setIsSearching(true);
      setSearchStatus("Searching for flights...");
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: "" });

      // Show extended loading message after 8 seconds
      const statusTimeout = setTimeout(() => {
        setSearchStatus(
          "This is taking a bit longer than usual... Please wait"
        );
      }, 8000);

      // Perform search
      const results = await flightApi.searchFlights(searchParams);
      clearTimeout(statusTimeout);

      // Handle results
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
      handleSearchError(error);
    } finally {
      // Reset loading state
      setIsSearching(false);
      setSearchStatus("");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Error handling for search
  const handleSearchError = (error: unknown) => {
    let errorMessage = "Something went wrong. Please try again.";

    if (error instanceof FlightApiError) {
      errorMessage = getErrorMessage(error);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Add general suggestions
    const suggestions = getSuggestions();
    if (
      suggestions.length > 0 &&
      !(error instanceof FlightApiError && error.code === "SEARCH_INCOMPLETE")
    ) {
      errorMessage += `\n\nSuggestions:\n• ${suggestions.join("\n• ")}`;
    }

    dispatch({ type: "SET_ERROR", payload: errorMessage });
    setSearchAttempts((prev) => prev + 1);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Type Selection */}
        <div className="flex space-x-4">
          {tripTypeOptions.map(({ value, label }) => (
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

        {/* Airport Selection */}
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

        {/* Date Selection */}
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
          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passengers
            </label>
            <div className="grid grid-cols-3 gap-3">
              {passengerTypes.map(({ key, label, min }) => (
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

          {/* Cabin Class */}
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
              {cabinClassOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isSearching}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-lg"
        >
          {isSearching ? "Searching..." : "Search Flights"}
        </button>

        {/* Search Status */}
        {searchStatus && (
          <div className="text-center text-sm text-gray-600">
            {searchStatus}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchForm;
