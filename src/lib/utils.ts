
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and tailwind-merge
 * for optimized Tailwind CSS class combinations
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

/**
 * Gets formatted latitude and longitude strings from an object,
 * safely handling missing or invalid coordinate data
 */
export function getCoordinates(coordinates: any): { lat: string; lng: string } {
  const parsedCoords = parseCoordinates(coordinates);
  return {
    lat: formatCoordinate(parsedCoords.lat),
    lng: formatCoordinate(parsedCoords.lng)
  };
}

/**
 * Format status text for display with proper capitalization
 * @param status The status string to format
 * @returns Formatted status text
 */
export function formatStatus(status: string): string {
  if (!status) return 'Unknown';
  
  // Handle statuses with underscores (e.g., "in_progress" -> "In Progress")
  if (status.includes('_')) {
    return status.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Handle regular statuses (e.g., "pending" -> "Pending")
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Get an appropriate CSS class for status badges based on status value
 * @param status The status string
 * @returns CSS class for the badge
 */
export function getStatusBadgeVariant(status: string): string {
  switch (status) {
    case 'pending':
      return "bg-yellow-100 text-yellow-800";
    case 'confirmed':
      return "bg-blue-100 text-blue-800";
    case 'in_progress':
      return "bg-purple-100 text-purple-800";
    case 'awaiting_pickup':
      return "bg-orange-100 text-orange-800";
    case 'completed':
      return "bg-green-100 text-green-800";
    case 'canceled':
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
