
// Type definitions for Google Maps API
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds): void;
      controls: any[][];
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setPosition(latLng: LatLng | LatLngLiteral): void;
      setMap(map: Map | null): void;
      setIcon(icon: string | Icon): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
      getPosition(): LatLng;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(latLng: LatLng | LatLngLiteral): LatLngBounds;
    }

    class MapsEventListener {
      remove(): void;
    }

    const ControlPosition: {
      TOP_LEFT: number;
      TOP_CENTER: number;
      TOP_RIGHT: number;
      LEFT_TOP: number;
      LEFT_CENTER: number;
      LEFT_BOTTOM: number;
      RIGHT_TOP: number;
      RIGHT_CENTER: number;
      RIGHT_BOTTOM: number;
      BOTTOM_LEFT: number;
      BOTTOM_CENTER: number;
      BOTTOM_RIGHT: number;
    };

    const SymbolPath: {
      CIRCLE: number;
      FORWARD_CLOSED_ARROW: number;
      FORWARD_OPEN_ARROW: number;
      BACKWARD_CLOSED_ARROW: number;
      BACKWARD_OPEN_ARROW: number;
    };

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      label?: string;
      icon?: string | Icon;
    }

    interface Icon {
      url?: string;
      path?: number;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    namespace places {
      class SearchBox {
        constructor(inputField: HTMLInputElement, opts?: SearchBoxOptions);
        addListener(eventName: string, handler: Function): MapsEventListener;
        getPlaces(): PlaceResult[];
      }

      interface SearchBoxOptions {
        bounds?: LatLngBounds;
      }

      interface PlaceResult {
        geometry?: {
          location?: LatLng;
        };
        name?: string;
        formatted_address?: string;
      }
    }

    namespace geometry {
      namespace spherical {
        function computeDistanceBetween(from: LatLng | LatLngLiteral, to: LatLng | LatLngLiteral): number;
      }
    }

    namespace directions {
      class DirectionsService {
        route(request: DirectionsRequest, callback: (result: DirectionsResult, status: DirectionsStatus) => void): void;
      }

      interface DirectionsRequest {
        origin: string | LatLng | LatLngLiteral;
        destination: string | LatLng | LatLngLiteral;
        travelMode: TravelMode;
      }

      interface DirectionsResult {
        routes: DirectionsRoute[];
      }

      interface DirectionsRoute {
        legs: DirectionsLeg[];
      }

      interface DirectionsLeg {
        distance: Distance;
        duration: Duration;
      }

      interface Distance {
        text: string;
        value: number;
      }

      interface Duration {
        text: string;
        value: number;
      }

      type DirectionsStatus = 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_WAYPOINTS_EXCEEDED' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
      type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
    }
  }
}

declare interface Window {
  google: typeof google;
}
