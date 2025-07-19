import React from "react";
import type { FlightItinerary } from "../types/FlightItinerary";

interface FlightCardProps {
  flight: FlightItinerary;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      day: "numeric",
      month: "short"
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Flight Info */}
        <div className="flex-1 mb-4 lg:mb-0">
          {flight.legs.map((leg) => (
            <div key={leg.id} className="mb-4 last:mb-0">
              <div className="flex items-center space-x-4 mb-2">
                <img
                  src={leg.airline.logo}
                  alt={leg.airline.name}
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/api/placeholder/32/32";
                  }}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {leg.airline.name} {leg.flightNumber}
                  </div>
                  <div className="text-sm text-gray-600">{leg.aircraft}</div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="font-bold text-lg">
                    {formatTime(leg.departure)}
                  </div>
                  <div className="text-sm text-gray-600">{leg.origin.iata}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(leg.departure)}
                  </div>
                </div>

                <div className="flex-1 relative">
                  <div className="flex items-center">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <div className="mx-2 text-sm text-gray-600">
                      {formatDuration(leg.duration)}
                    </div>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                  {!flight.isDirectFlight && (
                    <div className="text-xs text-orange-600 text-center mt-1">
                      {flight.stops} stop{flight.stops > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className="font-bold text-lg">
                    {formatTime(leg.arrival)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {leg.destination.iata}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(leg.arrival)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price and Book */}
        <div className="lg:ml-6 lg:text-right">
          <div className="mb-2">
            <div className="text-2xl font-bold text-gray-900">
              {flight.price.formatted}
            </div>
            <div className="text-sm text-gray-600">per person</div>
          </div>

          <div className="mb-3">
            <div className="text-sm text-gray-600">via {flight.agent.name}</div>
            {flight.agent.isAirline && (
              <div className="text-xs text-green-600">Airline direct</div>
            )}
          </div>

          <button
            onClick={() => window.open(flight.deepLink, "_blank")}
            className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Select Flight
          </button>
        </div>
        <div className="lg:ml-6 lg:text-right">
          <div className="mb-2">
            <div className="text-2xl font-bold text-gray-900">
              {flight.price.formatted}
            </div>
            <div className="text-sm text-gray-600">per person</div>
          </div>

          <div className="mb-3">
            <div className="text-sm text-gray-600">via {flight.agent.name}</div>
            {flight.agent.isAirline && (
              <div className="text-xs text-green-600">Airline direct</div>
            )}
          </div>

          <button
            onClick={() => window.open(flight.deepLink, "_blank")}
            className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Select Flight
          </button>
        </div>
      </div>
    </div>
  );
};
