import React from "react";
import { useFlightContext } from "../context/FlightContext";
import { FlightCard } from "./FlightCard";

const FlightResults: React.FC = () => {
  const { state } = useFlightContext();
  const { searchResults, isLoading, error } = state;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Searching flights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-800 font-medium mb-2">Search Error</div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!searchResults || searchResults.itineraries.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-600 mb-2">No flights found</div>
        <div className="text-gray-500">Try adjusting your search criteria</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {searchResults.context.totalResults} flights found
        </h2>
      </div>

      {searchResults.itineraries.map((flight) => (
        <FlightCard key={flight.id} flight={flight} />
      ))}
    </div>
  );
};
export default FlightResults;
