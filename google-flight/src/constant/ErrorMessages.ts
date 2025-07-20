import type { FlightApiError } from "../service/FlightService";

//
export const getErrorMessage = (error: FlightApiError): string => {
  const messages: Record<string, string> = {
    NO_FLIGHTS_FOUND:
      "No flights found. Try different dates or nearby airports.",
    SEARCH_INCOMPLETE:
      "Search timed out. The route might have limited options - try different dates.",
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
