// Map component for the Results page: Google Map, route polylines, and delivery stops.
"use client";

import { useCallback, Fragment } from "react";
import { LoadScriptNext, GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import type { Route } from "../types";

const DAVIS_CENTER = { lat: 38.5449, lng: -121.7405 }; // Map center coordinates for Davis,CA (Google Maps needs as an initial center to position the initial view of the map)
const POLYLINE_COLOR = "#2563eb"; // Blue path per route (single mock route)

type MapComponentProps = {
  routes: Route[];
};

export default function MapComponent({ routes }: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
  const onMapLoad = useCallback((_map: google.maps.Map) => {}, []);

  if (!apiKey) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-zinc-100 text-zinc-600">
        Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[70vh] rounded-lg">
      <LoadScriptNext googleMapsApiKey={apiKey}>
        <GoogleMap
          center={DAVIS_CENTER}
          zoom={11}
          onLoad={onMapLoad}
          mapContainerStyle={{ width: "100%", height: "100%", minHeight: "70vh" }}
        >
        {routes.map((route) => {
          const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
          const path = sortedStops.map((s) => ({ lat: s.lat, lng: s.lng }));

          return (
            <Fragment key={route.vehicleId}>
              <Polyline
                path={path}
                options={{
                  strokeColor: POLYLINE_COLOR,
                  strokeWeight: 5,
                  strokeOpacity: 0.9,
                }}
              />
              {sortedStops.map((stop) => (
                <Marker
                  key={stop.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  title={stop.address}
                />
              ))}
            </Fragment>
          );
        })}
        </GoogleMap>
      </LoadScriptNext>
    </div>
  );
}
