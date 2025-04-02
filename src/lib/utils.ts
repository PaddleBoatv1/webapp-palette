
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * for optimized Tailwind CSS class combinations
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats coordinate values with proper decimal places
 * Handles undefined, null or NaN values gracefully
 */
export function formatCoordinate(value: any, decimalPlaces: number = 4): string {
  if (value === undefined || value === null) {
    return `0.${"0".repeat(decimalPlaces)}`;
  }
  
  const num = parseFloat(String(value));
  return !isNaN(num) ? num.toFixed(decimalPlaces) : `0.${"0".repeat(decimalPlaces)}`;
}

/**
 * Safely extracts lat/lng coordinates from various data formats
 * Returns a default coordinate object if parsing fails
 */
export function parseCoordinates(coordinates: any): { lat: number; lng: number } {
  // Handle empty or null values
  if (!coordinates) {
    return { lat: 0, lng: 0 };
  }
  
  // Handle string format (JSON)
  if (typeof coordinates === 'string') {
    try {
      const parsed = JSON.parse(coordinates);
      return { 
        lat: parseFloat(parsed.lat || 0), 
        lng: parseFloat(parsed.lng || 0) 
      };
    } catch (error) {
      console.error("Failed to parse coordinates string:", error);
      return { lat: 0, lng: 0 };
    }
  }
  
  // Handle object format
  if (typeof coordinates === 'object') {
    if (coordinates.lat !== undefined && coordinates.lng !== undefined) {
      return { 
        lat: parseFloat(String(coordinates.lat)), 
        lng: parseFloat(String(coordinates.lng)) 
      };
    }
  }
  
  return { lat: 0, lng: 0 };
}
