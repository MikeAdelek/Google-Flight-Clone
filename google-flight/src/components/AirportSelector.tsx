import type { Airport } from "../types/Airport";
import { useDebounce } from "../hooks/useDebounce";
import React, { useState, useRef, useEffect } from "react";
import { useAirportSearch } from "../hooks/useAirportSearch";

interface AirportSelectorProps {
  label: string;
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder: string;
}

export const AirportSelector: React.FC<AirportSelectorProps> = ({
  label,
  value,
  onChange,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { airports, isLoading, searchAirports } = useAirportSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchAirports(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchAirports]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          value={isOpen ? searchTerm : value?.name || ""}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-10"
          >
            {isLoading ? (
              <div className="p-3 text-gray-500">Searching...</div>
            ) : airports.length > 0 ? (
              airports.map((airport) => (
                <div
                  key={airport.iata}
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    // Prevent the input from losing focus
                    e.preventDefault();
                    handleSelect(airport);
                  }}
                >
                  <div className="font-medium">{airport.name}</div>
                  <div className="text-sm text-gray-600">
                    {airport.city}, {airport.country} ({airport.iata})
                  </div>
                </div>
              ))
            ) : searchTerm ? (
              <div className="p-3 text-gray-500">No airports found</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
