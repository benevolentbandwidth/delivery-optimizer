// Map component for the Results page: Google Map, route polylines, and delivery stops.
// Uses @react-google-maps/api with Advanced Markers
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { LoadScriptNext, GoogleMap, Marker, useGoogleMap } from "@react-google-maps/api";
import type { PendingPinMove, Route } from "../types";
import { routeColorHex } from "../utils/routeColors";

const DAVIS_CENTER = { lat: 38.5449, lng: -121.7405 };

function routePolylineOptions(strokeColor: string): google.maps.PolylineOptions {
  return {
    strokeColor,
    strokeWeight: 4,
    strokeOpacity: 0.75,
  };
}

function markerSvgDataUrl(fillColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 1C7.373 1 2 6.373 2 13c0 9.246 12 24 12 24s12-14.754 12-24C26 6.373 20.627 1 14 1z" fill="${fillColor}" stroke="#ffffff" stroke-width="2"/><circle cx="14" cy="13" r="4.25" fill="#ffffff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildRoutePath(
  route: Route,
  pendingPinMove: PendingPinMove | null
): google.maps.LatLngLiteral[] {
  const sorted = [...route.stops].sort((a, b) => a.sequence - b.sequence);
  return sorted.map((s) => {
    if (
      pendingPinMove?.vehicleId === route.vehicleId &&
      pendingPinMove.stopId === s.id
    ) {
      return { lat: pendingPinMove.lat, lng: pendingPinMove.lng };
    }
    return { lat: s.lat, lng: s.lng };
  });
}

function RoutePolylinesOverlay({
  routes,
  pendingPinMove,
  onRouteDistanceUpdate,
}: {
  routes: Route[];
  pendingPinMove: PendingPinMove | null;
  onRouteDistanceUpdate?: (vehicleId: string, distanceMi: number) => void;
}) {
  const map = useGoogleMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || typeof google === "undefined") return;

    polylinesRef.current.forEach((p) => {
      p.setMap(null);
    });
    polylinesRef.current = [];

    let cancelled = false;
    // Same browser session as the Maps JS script — billing still uses your Maps key, not a second secret.
    const directionsService = new google.maps.DirectionsService();

    const drawFallback = (route: Route, strokeColor: string) => {
      if (cancelled) return;
      const fallbackPath = buildRoutePath(route, pendingPinMove);
      if (fallbackPath.length < 2) return;
      const fallbackPoly = new google.maps.Polyline({
        map,
        path: fallbackPath,
        ...routePolylineOptions(strokeColor),
      });
      polylinesRef.current.push(fallbackPoly);
    };

    void Promise.allSettled(
      routes.map(async (route, routeIndex) => {
        const strokeColor = routeColorHex(routeIndex);
        const path = buildRoutePath(route, pendingPinMove);
        if (path.length < 2) return;
        const origin = path[0]!;
        const destination = path[path.length - 1]!;

        const waypoints = path.slice(1, -1).map((location) => ({ location, stopover: true }));
        // Google limits intermediate waypoints to 25; past that we skip Directions and use straight segments.
        if (waypoints.length > 25) {
          drawFallback(route, strokeColor);
          return;
        }

        try {
          const result = await directionsService.route({
            origin,
            destination,
            waypoints,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING,
          });
          if (cancelled) return;

          const roadPath = result.routes[0]?.overview_path;
          if (!roadPath || roadPath.length < 2) {
            drawFallback(route, strokeColor);
            return;
          }

          const totalMeters = (result.routes[0]?.legs ?? []).reduce(
            (sum, leg) => sum + (leg.distance?.value ?? 0),
            0
          );
          if (totalMeters > 0 && onRouteDistanceUpdate) {
            const distanceMi = Number((totalMeters / 1609.344).toFixed(1));
            onRouteDistanceUpdate(route.vehicleId, distanceMi);
          }
          if (cancelled) return;

          const roadPoly = new google.maps.Polyline({
            map,
            path: roadPath,
            ...routePolylineOptions(strokeColor),
          });
          polylinesRef.current.push(roadPoly);
        } catch {
          drawFallback(route, strokeColor);
        }
      })
    );

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => {
        p.setMap(null);
      });
      polylinesRef.current = [];
    };
  }, [map, routes, pendingPinMove, onRouteDistanceUpdate]);

  return null;
}

function latLngFromMarkerPosition(
  p: google.maps.marker.AdvancedMarkerElement["position"]
): { lat: number; lng: number } | null {
  if (p == null) return null;
  if (typeof (p as google.maps.LatLng).lat === "function") {
    const ll = p as google.maps.LatLng;
    return { lat: ll.lat(), lng: ll.lng() };
  }
  const lit = p as google.maps.LatLngLiteral;
  if (typeof lit.lat === "number" && typeof lit.lng === "number") {
    return { lat: lit.lat, lng: lit.lng };
  }
  return null;
}

type MapComponentProps = {
  routes: Route[];
  isEditMode: boolean;
  pendingPinMove: PendingPinMove | null;
  onPendingPinMove: (vehicleId: string, stopId: string, lat: number, lng: number) => void;
  onRouteDistanceUpdate?: (vehicleId: string, distanceMi: number) => void;
};

type AdvancedMarkersProps = {
  map: google.maps.Map | null;
  routes: Route[];
  isEditMode: boolean;
  pendingPinMove: PendingPinMove | null;
  onPendingPinMove: (vehicleId: string, stopId: string, lat: number, lng: number) => void;
};

function stopKey(vehicleId: string, stopId: string): string {
  return `${vehicleId}:${stopId}`;
}

function AdvancedMarkers({
  map,
  routes,
  isEditMode,
  pendingPinMove,
  onPendingPinMove,
}: AdvancedMarkersProps) {
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const markerByStopKeyRef = useRef<Record<string, google.maps.marker.AdvancedMarkerElement>>({});
  const pendingPinMoveRef = useRef(pendingPinMove);

  useEffect(() => {
    pendingPinMoveRef.current = pendingPinMove;
  }, [pendingPinMove]);

  // Rebuild markers only when map, routes, edit mode, or handler identity change — not on every draft coord update.
  useEffect(() => {
    if (!map || routes.length === 0) return;

    let cancelled = false;
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    markerByStopKeyRef.current = {};

    (async () => {
      try {
        const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

        if (cancelled) return;

        routes.forEach((route, routeIndex) => {
          const accentColor = routeColorHex(routeIndex);
          const sorted = [...route.stops].sort((a, b) => a.sequence - b.sequence);
          sorted.forEach((stop) => {
            const position = { lat: stop.lat, lng: stop.lng };
            const pin = document.createElement("div");
            pin.style.position = "relative";
            pin.style.width = "18px";
            pin.style.height = "18px";
            pin.style.borderRadius = "9999px 9999px 9999px 0";
            pin.style.transform = "rotate(-45deg)";
            pin.style.transformOrigin = "center";
            pin.style.backgroundColor = accentColor;
            pin.style.border = "2px solid #ffffff";
            pin.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.35)";
            const inner = document.createElement("span");
            inner.style.position = "absolute";
            inner.style.width = "6px";
            inner.style.height = "6px";
            inner.style.borderRadius = "9999px";
            inner.style.background = "#ffffff";
            inner.style.top = "4px";
            inner.style.left = "4px";
            pin.appendChild(inner);

            const m = new AdvancedMarkerElement({
              map,
              position,
              title: stop.address,
              gmpDraggable: isEditMode,
              content: pin,
            });

            m.addListener("dragend", () => {
              const ll = latLngFromMarkerPosition(m.position);
              if (!ll) return;
              onPendingPinMove(route.vehicleId, stop.id, ll.lat, ll.lng);
            });

            markers.push(m);
            markerByStopKeyRef.current[stopKey(route.vehicleId, stop.id)] = m;
          });
        });

        if (cancelled) {
          markers.forEach((m) => {
            google.maps.event.clearInstanceListeners(m);
            m.map = null;
          });
          return;
        }

        markersRef.current = markers;

        const p = pendingPinMoveRef.current;
        if (p) {
          const m = markerByStopKeyRef.current[stopKey(p.vehicleId, p.stopId)];
          if (m) m.position = { lat: p.lat, lng: p.lng };
        }
      } catch {
        // Advanced markers need mapId; missing library leaves map without pins.
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => {
        google.maps.event.clearInstanceListeners(m);
        m.map = null;
      });
      markersRef.current = [];
      markerByStopKeyRef.current = {};
    };
  }, [map, routes, isEditMode, onPendingPinMove]);

  // Move one pin for drafts, or snap all pins back to `routes` when draft clears — avoids rebuilding every marker on each drag.
  useEffect(() => {
    if (!map) return;
    if (pendingPinMove) {
      const m = markerByStopKeyRef.current[stopKey(pendingPinMove.vehicleId, pendingPinMove.stopId)];
      if (m) m.position = { lat: pendingPinMove.lat, lng: pendingPinMove.lng };
      return;
    }
    routes.forEach((route) => {
      route.stops.forEach((stop) => {
        const m = markerByStopKeyRef.current[stopKey(route.vehicleId, stop.id)];
        if (m) m.position = { lat: stop.lat, lng: stop.lng };
      });
    });
  }, [map, pendingPinMove, routes]);

  return null;
}

export default function MapComponent({
  routes,
  isEditMode,
  pendingPinMove,
  onPendingPinMove,
  onRouteDistanceUpdate,
}: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      if (routes.length === 0) return;
      const bounds = new google.maps.LatLngBounds();
      routes.forEach((route) => {
        route.stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
      });
      mapInstance.fitBounds(bounds, 48);
    },
    [routes]
  );

  const onUnmount = useCallback(() => setMap(null), []);
  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    const handleResize = () => {
      google.maps.event.trigger(map, "resize");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  const mapOptions = useMemo(
    (): google.maps.MapOptions => ({
      center: DAVIS_CENTER,
      zoom: 11,
      ...(mapId ? { mapId } : {}),
    }),
    [mapId]
  );

  if (!apiKey) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-zinc-100 text-zinc-600">
        Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg">
      <LoadScriptNext
        googleMapsApiKey={apiKey}
        mapIds={mapId ? [mapId] : undefined}
        loadingElement={<div className="min-h-[70vh] bg-zinc-100 animate-pulse rounded-lg" />}
      >
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={mapOptions}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
        >
          <RoutePolylinesOverlay
            routes={routes}
            pendingPinMove={pendingPinMove}
            onRouteDistanceUpdate={onRouteDistanceUpdate}
          />
          {mapId && (
            <AdvancedMarkers
              map={map}
              routes={routes}
              isEditMode={isEditMode}
              pendingPinMove={pendingPinMove}
              onPendingPinMove={onPendingPinMove}
            />
          )}
          {!mapId &&
            routes.map((route, routeIndex) => {
              const accentColor = routeColorHex(routeIndex);
              const iconUrl = markerSvgDataUrl(accentColor);
              const sorted = [...route.stops].sort((a, b) => a.sequence - b.sequence);
              return (
                <Fragment key={route.vehicleId}>
                  {sorted.map((stop) => {
                    const atPending =
                      pendingPinMove != null &&
                      pendingPinMove.vehicleId === route.vehicleId &&
                      pendingPinMove.stopId === stop.id;
                    const position = atPending
                      ? { lat: pendingPinMove.lat, lng: pendingPinMove.lng }
                      : { lat: stop.lat, lng: stop.lng };
                    return (
                      <Marker
                        key={stop.id}
                        position={position}
                        title={stop.address}
                        icon={{ url: iconUrl, scaledSize: new google.maps.Size(28, 40) }}
                        draggable={isEditMode}
                        onDragEnd={(e) => {
                          const latLng = e.latLng;
                          if (!latLng) return;
                          onPendingPinMove(
                            route.vehicleId,
                            stop.id,
                            latLng.lat(),
                            latLng.lng()
                          );
                        }}
                      />
                    );
                  })}
                </Fragment>
              );
            })}
        </GoogleMap>
      </LoadScriptNext>
    </div>
  );
}
