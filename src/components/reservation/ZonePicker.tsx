
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zone } from "@/lib/supabase";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { geoJSONToLatLng } from "@/lib/googleMapsUtils";

// Add your Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAEohpaXRaceIHcyWwsRuTGemtEH-IRnkc";

interface ZonePickerProps {
  zones: Zone[];
  onSelect: (startZoneId: string, endZoneId: string) => void;
}

const ZonePicker = ({ zones, onSelect }: ZonePickerProps) => {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedStartZone, setSelectedStartZone] = useState<Zone | null>(null);
  const [selectedEndZone, setSelectedEndZone] = useState<Zone | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps API with necessary libraries
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
      return () => {
        document.head.removeChild(script);
      };
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map once Google Maps API is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 45.4215, lng: -75.6972 }, // Default to Ottawa, Canada
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(newMap);

    // Add places search box
    const input = document.createElement('input');
    input.className = 'controls';
    input.type = 'text';
    input.placeholder = 'Search for a location';
    input.style.margin = '10px';
    input.style.padding = '8px';
    input.style.borderRadius = '4px';
    input.style.width = '250px';
    
    newMap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    
    const searchBox = new google.maps.places.SearchBox(input);
    
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) return;
      
      // Get the first place
      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;
      
      // Center map on searched location
      newMap.setCenter(place.geometry.location);
      newMap.setZoom(15);
    });

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          newMap.setCenter(userLocation);
          
          // Add user marker
          new window.google.maps.Marker({
            position: userLocation,
            map: newMap,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
            title: "Your Location"
          });
        },
        () => {
          toast({
            title: "Location access denied",
            description: "We couldn't access your location. Using default map view.",
            variant: "destructive"
          });
        }
      );
    }
  }, [mapLoaded, toast]);

  // Add zone markers when map and zones are available
  useEffect(() => {
    if (!map || !zones || zones.length === 0) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Add markers for each zone
    zones.forEach(zone => {
      if (!zone.coordinates) return;
      
      try {
        const coordinates = typeof zone.coordinates === 'string' 
          ? JSON.parse(zone.coordinates) 
          : zone.coordinates;
          
        if (!coordinates.lat || !coordinates.lng) return;
        
        const marker = new window.google.maps.Marker({
          position: { lat: coordinates.lat, lng: coordinates.lng },
          map,
          title: zone.zone_name,
          label: zone.is_premium ? "P" : undefined,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue for normal, red for selected
          }
        });

        marker.addListener("click", () => {
          handleZoneClick(zone);
        });

        newMarkers.push(marker);
      } catch (error) {
        console.error("Error parsing zone coordinates:", error);
      }
    });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds);
    }

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, zones]);

  // Update marker icons when selections change
  useEffect(() => {
    if (!markers.length) return;
    
    markers.forEach((marker, index) => {
      const zone = zones[index];
      if (!zone) return;
      
      if (zone.id === selectedStartZone?.id) {
        marker.setIcon({
          url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", // Green for start
        });
      } else if (zone.id === selectedEndZone?.id) {
        marker.setIcon({
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // Red for end
        });
      } else {
        marker.setIcon({
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue for unselected
        });
      }
    });
  }, [selectedStartZone, selectedEndZone, markers, zones]);

  const handleZoneClick = useCallback((zone: Zone) => {
    if (!selectedStartZone) {
      setSelectedStartZone(zone);
      toast({
        title: "Start location selected",
        description: `${zone.zone_name} set as your starting point`
      });
    } else if (!selectedEndZone) {
      // Don't allow same zone for start and end
      if (zone.id === selectedStartZone.id) {
        toast({
          title: "Invalid selection",
          description: "Start and end zones must be different",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedEndZone(zone);
      toast({
        title: "End location selected",
        description: `${zone.zone_name} set as your destination`
      });
    } else {
      // Reset selections if both are already selected
      setSelectedStartZone(zone);
      setSelectedEndZone(null);
      toast({
        title: "Selections reset",
        description: `${zone.zone_name} set as your new starting point`
      });
    }
  }, [selectedStartZone, selectedEndZone, toast]);

  const handleConfirm = () => {
    if (selectedStartZone && selectedEndZone) {
      onSelect(selectedStartZone.id, selectedEndZone.id);
    } else {
      toast({
        title: "Incomplete selection",
        description: "Please select both start and end locations",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-0">
            <div 
              ref={mapRef}
              className="w-full h-[400px] rounded-md overflow-hidden"
            />
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-2">Selected Locations</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    {selectedStartZone 
                      ? selectedStartZone.zone_name 
                      : "Select starting point on map"}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Navigation className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm">
                    {selectedEndZone 
                      ? selectedEndZone.zone_name 
                      : "Select destination on map"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={handleConfirm}
              disabled={!selectedStartZone || !selectedEndZone}
            >
              Confirm Locations
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setSelectedStartZone(null);
                setSelectedEndZone(null);
              }}
            >
              Reset Selections
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
        {zones.map((zone) => (
          <Button
            key={zone.id}
            variant="outline"
            className={cn(
              "h-auto py-2 justify-start",
              zone.id === selectedStartZone?.id && "border-green-500 bg-green-50",
              zone.id === selectedEndZone?.id && "border-red-500 bg-red-50"
            )}
            onClick={() => handleZoneClick(zone)}
          >
            <span className="truncate">{zone.zone_name}</span>
            {zone.is_premium && (
              <span className="ml-auto text-yellow-500 text-xs">PREMIUM</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ZonePicker;
