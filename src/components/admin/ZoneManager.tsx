
import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Zone } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash, Plus, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ZoneManagerProps {
  zones: Zone[];
  isLoading: boolean;
}

// Helper function to safely get coordinates regardless of format
const getCoordinates = (coordinates: any) => {
  if (!coordinates) {
    return { lat: 0, lng: 0 };
  }
  
  // Handle string format
  if (typeof coordinates === 'string') {
    try {
      return JSON.parse(coordinates);
    } catch (e) {
      console.error('Failed to parse coordinates string:', e);
      return { lat: 0, lng: 0 };
    }
  }
  
  // Handle object format
  if (typeof coordinates === 'object') {
    if (coordinates.lat !== undefined && coordinates.lng !== undefined) {
      return { 
        lat: parseFloat(coordinates.lat), 
        lng: parseFloat(coordinates.lng) 
      };
    }
  }
  
  return { lat: 0, lng: 0 };
};

// Format coordinates safely for display
const formatCoordinate = (value: any): string => {
  if (value === undefined || value === null) {
    return "0.0000";
  }
  
  const num = parseFloat(String(value));
  return !isNaN(num) ? num.toFixed(4) : "0.0000";
};

const ZoneManager = ({ zones, isLoading }: ZoneManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [newZone, setNewZone] = useState({
    zone_name: '',
    is_premium: false,
    description: '',
    coordinates: { lat: 0, lng: 0 }
  });
  const [showAddZoneForm, setShowAddZoneForm] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapMarker, setMapMarker] = useState<google.maps.Marker | null>(null);
  
  // Setup Google Maps
  React.useEffect(() => {
    if (!showAddZoneForm || !mapRef.current) return;
    
    const initMap = () => {
      const newMap = new window.google.maps.Map(mapRef.current!, {
        center: { lat: 45.4215, lng: -75.6972 }, // Default to Ottawa
        zoom: 13,
      });
      
      setMap(newMap);
      
      // Allow clicking on map to set zone location
      newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          setNewZone(prev => ({
            ...prev,
            coordinates: { lat, lng }
          }));
          
          // Update or create marker
          if (mapMarker) {
            mapMarker.setPosition(e.latLng);
          } else {
            const marker = new google.maps.Marker({
              position: e.latLng,
              map: newMap,
              title: 'New Zone Location',
              draggable: true
            });
            
            // Update coordinates when marker is dragged
            marker.addListener('dragend', () => {
              const position = marker.getPosition();
              if (position) {
                setNewZone(prev => ({
                  ...prev,
                  coordinates: { lat: position.lat(), lng: position.lng() }
                }));
              }
            });
            
            setMapMarker(marker);
          }
        }
      });
    };
    
    if (window.google) {
      initMap();
    } else {
      const GOOGLE_MAPS_API_KEY = "AIzaSyAEohpaXRaceIHcyWwsRuTGemtEH-IRnkc";
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
    
    return () => {
      if (mapMarker) {
        mapMarker.setMap(null);
        setMapMarker(null);
      }
    };
  }, [showAddZoneForm]);
  
  // Create Zone Mutation
  const createZone = useMutation({
    mutationFn: async (zone: Partial<Zone>) => {
      const { data, error } = await supabase
        .from('zones')
        .insert([zone])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Zone Created",
        description: "The new pickup/dropoff zone has been added."
      });
      setShowAddZoneForm(false);
      setNewZone({
        zone_name: '',
        is_premium: false,
        description: '',
        coordinates: { lat: 0, lng: 0 }
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create zone: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Delete Zone Mutation
  const deleteZone = useMutation({
    mutationFn: async (zoneId: string) => {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', zoneId);
        
      if (error) throw error;
      return zoneId;
    },
    onSuccess: (zoneId) => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Zone Deleted",
        description: "The zone has been removed."
      });
      if (selectedZone?.id === zoneId) {
        setSelectedZone(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete zone: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleAddZone = () => {
    if (!newZone.zone_name || newZone.coordinates.lat === 0) {
      toast({
        title: "Invalid Zone",
        description: "Please provide a zone name and select a location on the map.",
        variant: "destructive"
      });
      return;
    }
    
    createZone.mutate({
      zone_name: newZone.zone_name,
      is_premium: newZone.is_premium,
      description: newZone.description || null,
      coordinates: newZone.coordinates
    });
  };
  
  const handleDeleteZone = (zoneId: string) => {
    if (confirm("Are you sure you want to delete this zone? This action cannot be undone.")) {
      deleteZone.mutate(zoneId);
    }
  };
  
  return (
    <div className="space-y-6">
      {showAddZoneForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add New Zone</CardTitle>
            <CardDescription>
              Create a new pickup/dropoff location for paddle boats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName">Zone Name</Label>
                <Input
                  id="zoneName"
                  value={newZone.zone_name}
                  onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                  placeholder="e.g., Downtown Dock"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zoneDescription">Description (Optional)</Label>
                <Input
                  id="zoneDescription"
                  value={newZone.description}
                  onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                  placeholder="e.g., Located near the main bridge"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPremium"
                  checked={newZone.is_premium}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, is_premium: checked })}
                />
                <Label htmlFor="isPremium">Premium Zone (Higher Pricing)</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Zone Location (Click on map to set)</Label>
                <div 
                  ref={mapRef}
                  className="w-full h-[300px] rounded-md border"
                ></div>
                
                {newZone.coordinates.lat !== 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {formatCoordinate(newZone.coordinates.lat)}, {formatCoordinate(newZone.coordinates.lng)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowAddZoneForm(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddZone}
              disabled={createZone.isPending}
            >
              {createZone.isPending ? 'Creating...' : 'Create Zone'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Manage Pickup/Dropoff Zones</h2>
          <Button onClick={() => setShowAddZoneForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Zone
          </Button>
        </div>
      )}
      
      {!showAddZoneForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : zones.length === 0 ? (
            <Alert>
              <AlertDescription>
                No zones have been created yet. Add your first pickup/dropoff zone to get started.
              </AlertDescription>
            </Alert>
          ) : (
            zones.map((zone) => {
              // Safely get coordinates
              const coords = getCoordinates(zone.coordinates);
              
              return (
                <Card key={zone.id} className={zone.is_premium ? "border-yellow-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{zone.zone_name}</CardTitle>
                      {zone.is_premium && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Premium
                        </span>
                      )}
                    </div>
                    {zone.description && (
                      <CardDescription>{zone.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {coords.lat !== 0 || coords.lng !== 0 ? (
                        <span>
                          {formatCoordinate(coords.lat)}, {formatCoordinate(coords.lng)}
                        </span>
                      ) : (
                        <span>No coordinates set</span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="ml-auto"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ZoneManager;
