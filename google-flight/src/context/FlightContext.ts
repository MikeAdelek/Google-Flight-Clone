import type { SearchFormData } from "../types/SearchFormData";
import type { FlightSearchResponse } from "../types/FlightSearchResponse";
import type { ReactNode } from "react";
import React, { createContext, useContext, useReducer } from "react";

interface FlightState {
  searchFormData: SearchFormData;
  searchResults: FlightSearchResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    priceRange: [number, number];
    airlines: string[];
    stops: number[];
    departureTime: string[];
    duration: [number, number];
  };
  sortBy: "price_low" | "duration" | "departure";
}

type FlightAction =
  | { type: "SET_SEARCH_FORM_DATA"; payload: Partial<SearchFormData> }
  | { type: "SET_SEARCH_RESULTS"; payload: FlightSearchResponse }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FILTERS"; payload: Partial<FlightState["filters"]> }
  | { type: "SET_SORT_BY"; payload: FlightState["sortBy"] }
  | { type: "CLEAR_RESULTS" };

const initialState: FlightState = {
  searchFormData: {
    tripType: "round-trip",
    from: null,
    to: null,
    departDate: new Date().toISOString().split("T")[0],
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    passengers: { adults: 1, children: 0, infants: 0 },
    cabinClass: "economy"
  },
  searchResults: null,
  isLoading: false,
  error: null,
  filters: {
    priceRange: [0, 10000],
    airlines: [],
    stops: [],
    departureTime: [],
    duration: [0, 1440]
  },
  sortBy: "price_low"
};

function flightReducer(state: FlightState, action: FlightAction): FlightState {
  switch (action.type) {
    case "SET_SEARCH_FORM_DATA":
      return {
        ...state,
        searchFormData: { ...state.searchFormData, ...action.payload }
      };
    case "SET_SEARCH_RESULTS":
      return {
        ...state,
        searchResults: action.payload,
        isLoading: false,
        error: null
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "SET_SORT_BY":
      return { ...state, sortBy: action.payload };
    case "CLEAR_RESULTS":
      return { ...state, searchResults: null, error: null };
    default:
      return state;
  }
}

interface FlightContextType {
  state: FlightState;
  dispatch: React.Dispatch<FlightAction>;
  updateSearchForm: (data: Partial<SearchFormData>) => void;
  updateFilters: (filters: Partial<FlightState["filters"]>) => void;
  setSortBy: (sortBy: FlightState["sortBy"]) => void;
  clearResults: () => void;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);
export function FlightProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flightReducer, initialState);

  const updateSearchForm = (data: Partial<SearchFormData>) => {
    dispatch({ type: "SET_SEARCH_FORM_DATA", payload: data });
  };

  const updateFilters = (filters: Partial<FlightState["filters"]>) => {
    dispatch({
      type: "SET_FILTERS",
      payload: filters
    });
  };

  const setSortBy = (sortBy: FlightState["sortBy"]) => {
    dispatch({ type: "SET_SORT_BY", payload: sortBy });
  };

  const clearResults = () => {
    dispatch({ type: "CLEAR_RESULTS" });
  };

  const contextValue: FlightContextType = {
    state,
    dispatch,
    setSortBy,
    clearResults,
    updateFilters,
    updateSearchForm
  };

  return React.createElement(
    FlightContext.Provider,
    { value: contextValue },
    children
  );
}

export const useFlightContext = () => {
  const context = useContext(FlightContext);
  if (context === undefined) {
    throw new Error("useFlightContext must be used within a FlightProvider");
  }
  return context;
};
