
/**
 * Utility functions for working with Google Maps API
 */

// Convert GeoJSON coordinates to Google Maps LatLng
export const geoJSONToLatLng = (coordinates: any): google.maps.LatLngLiteral | null => {
  if (!coordinates) return null;
  
  try {
    const coords = typeof coordinates === 'string' 
      ? JSON.parse(coordinates) 
      : coordinates;
      
    if (coords.lat && coords.lng) {
      return { lat: coords.lat, lng: coords.lng };
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing coordinates:", error);
    return null;
  }
};

// Calculate approximate ETA between two points (straight line distance)
export const calculateETA = (
  origin: google.maps.LatLngLiteral, 
  destination: google.maps.LatLngLiteral,
  speedKmPerHour = 5 // Average paddleboat speed
): number => {
  // Calculate distance using the Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  // Calculate time in minutes
  const timeInHours = distance / speedKmPerHour;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  return timeInMinutes;
};

// Helper function to convert degrees to radians
const toRad = (degrees: number): number => {
  return degrees * Math.PI / 180;
};

// Format distance for display
export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    // Convert to meters for distances less than 1 km
    const meters = Math.round(distanceInKm * 1000);
    return `${meters} m`;
  }
  
  return `${distanceInKm.toFixed(1)} km`;
};

// Estimate trip cost based on distance and time
export const estimateCost = (
  distanceInKm: number, 
  minutes: number, 
  isPremiumZone: boolean = false
): number => {
  // Base pricing model (customize as needed)
  const baseFee = 10; // Base reservation fee
  const perKmRate = 2.5; // Cost per kilometer
  const perMinuteRate = 0.25; // Cost per minute
  const premiumMultiplier = isPremiumZone ? 1.5 : 1; // Premium zone markup
  
  const distanceFee = distanceInKm * perKmRate;
  const timeFee = minutes * perMinuteRate;
  
  const totalBeforePremium = baseFee + distanceFee + timeFee;
  const totalCost = totalBeforePremium * premiumMultiplier;
  
  // Round to nearest dollar
  return Math.ceil(totalCost);
};
