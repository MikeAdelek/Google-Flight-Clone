import React, { useState } from "react";
import { useFlightContext } from "../context/FlightContext";
import { RangeSlider } from "./RangeSlider";
import { CheckboxGroup } from "./CheckboxGroup";

const FlightFilters: React.FC = () => {
  const { state, updateFilters } = useFlightContext();
  // const { filters, searchResults } = state;

  const formatPrice = (price: number) => `$${price}`;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  };

  const clearAllFilters = () => {
    updateFilters({
      priceRange: [0, 10000],
      airlines: [],
      stops: [],
      departureTime: [],
      duration: [0, 1440]
    });
  };

  // Get Filter options from search Results

  return (
    <div>
      <div></div>
    </div>
  );
};
export default FlightFilters;
