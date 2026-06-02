// Map component for the Results page: Google Map, route polylines, and delivery stops.
// Uses @react-google-maps/api with Advanced Markers
"use client";

import {
  default as React,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
} from "react";
import {
  LoadScriptNext,
  GoogleMap,
  Marker,
  useGoogleMap,
} from "@react-google-maps/api";
import type { HoveredStopInfo, PendingPinMove, Route, Stop } from "../types";
import { routeColorHex } from "../utils/routeColors";
import MapStopHoverOverlay from "./MapStopHoverOverlay";

declare const process: {
  env: Record<string, string | undefined>;
};

const DAVIS_CENTER = { lat: 38.5449, lng: -121.7405 };
const MARKER_ICON_WIDTH = 28;
const MARKER_ICON_HEIGHT = 40;

function getMarkerScaledSize(): google.maps.Size | undefined {
  if (typeof google === "undefined") return undefined;
  return new google.maps.Size(MARKER_ICON_WIDTH, MARKER_ICON_HEIGHT);
}

// fillColor is always a route palette hex from routeColorHex, never user input.
function markerSvgDataUrl(fillColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_ICON_WIDTH}" height="${MARKER_ICON_HEIGHT}" viewBox="0 0 28 40"><path d="M14 1C7.373 1 2 6.373 2 13c0 9.246 12 24 12 24s12-14.754 12-24C26 6.373 20.627 1 14 1z" fill="${fillColor}" stroke="#ffffff" stroke-width="2"/><circle cx="14" cy="13" r="4.25" fill="#ffffff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createRoutePinElement(fillColor: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.width = `${MARKER_ICON_WIDTH}px`;
  wrapper.style.height = `${MARKER_ICON_HEIGHT}px`;
  // Anchor bottom-center of the pin on the stop (tip is at y=40 in the SVG).
  wrapper.style.transform = "translate(-50%, -100%)";
  wrapper.style.filter = "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))";

  const img = document.createElement("img");
  img.src = markerSvgDataUrl(fillColor);
  img.width = MARKER_ICON_WIDTH;
  img.height = MARKER_ICON_HEIGHT;
  img.style.display = "block";
  img.draggable = false;
  img.alt = "";
  wrapper.appendChild(img);
  return wrapper;
}

function routePolylineOptions(
  strokeColor: string,
): google.maps.PolylineOptions {
  return {
    strokeColor,
    strokeWeight: 5,
    strokeOpacity: 0.85,
  };
}

type CachedDirections = { path: google.maps.LatLng[]; meters: number };

const MAX_DIRECTIONS_CACHE_SIZE = 100;

function rememberDirections(
  cache: Map<string, CachedDirections>,
  cacheKey: string,
  entry: CachedDirections,
) {
  cache.set(cacheKey, entry);
  while (cache.size > MAX_DIRECTIONS_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey === undefined) break;
    cache.delete(firstKey);
  }
}

function routeCacheKey(path: google.maps.LatLngLiteral[]): string {
  return path.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("|");
}

function buildRoutePath(
  route: Route,
  pendingPinMove: PendingPinMove | null,
): google.maps.LatLngLiteral[] {
  const sorted = [...route.stops].sort((a, b) => a.sequence - b.sequence);
  const deliveryPoints = sorted.map((s) => {
    if (
      pendingPinMove?.vehicleId === route.vehicleId &&
      pendingPinMove.stopId === s.id
    ) {
      return { lat: pendingPinMove.lat, lng: pendingPinMove.lng };
    }
    return { lat: s.lat, lng: s.lng };
  });
  if (route.startLocation) {
    return [
      { lat: route.startLocation.lat, lng: route.startLocation.lng },
      ...deliveryPoints,
    ];
  }
  return deliveryPoints;
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
  const polylinesByVehicleRef = useRef<Record<string, google.maps.Polyline>>(
    {},
  );
  const directionsCacheRef = useRef(new Map<string, CachedDirections>());

  useEffect(() => {
    if (!map || typeof google === "undefined") return;

    Object.values(polylinesByVehicleRef.current).forEach((p) => p.setMap(null));
    polylinesByVehicleRef.current = {};

    let cancelled = false;
    const directionsService = new google.maps.DirectionsService();

    const drawFallback = (route: Route, strokeColor: string) => {
      if (cancelled) return;
      const fallbackPath = buildRoutePath(route, null);
      if (fallbackPath.length < 2) return;
      const fallbackPoly = new google.maps.Polyline({
        map,
        path: fallbackPath,
        ...routePolylineOptions(strokeColor),
      });
      polylinesByVehicleRef.current[route.vehicleId] = fallbackPoly;
    };

    void Promise.allSettled(
      routes.map(async (route, routeIndex) => {
        const strokeColor = routeColorHex(routeIndex);
        const path = buildRoutePath(route, null);
        if (path.length < 2) return;
        const origin = path[0]!;
        const destination = path[path.length - 1]!;

        const waypoints = path
          .slice(1, -1)
          .map((location) => ({ location, stopover: true }));
        if (waypoints.length > 25) {
          drawFallback(route, strokeColor);
          return;
        }

        const cacheKey = routeCacheKey(path);
        const cached = directionsCacheRef.current.get(cacheKey);
        if (cached && cached.path.length >= 2) {
          if (cancelled) return;
          const cachedPoly = new google.maps.Polyline({
            map,
            path: cached.path,
            ...routePolylineOptions(strokeColor),
          });
          polylinesByVehicleRef.current[route.vehicleId] = cachedPoly;
          if (cancelled) return;
          if (cached.meters > 0 && onRouteDistanceUpdate) {
            const distanceMi = Number((cached.meters / 1609.344).toFixed(1));
            onRouteDistanceUpdate(route.vehicleId, distanceMi);
          }
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
            0,
          );
          if (cancelled) return;
          if (totalMeters > 0 && onRouteDistanceUpdate) {
            const distanceMi = Number((totalMeters / 1609.344).toFixed(1));
            onRouteDistanceUpdate(route.vehicleId, distanceMi);
          }
          if (cancelled) return;

          rememberDirections(directionsCacheRef.current, cacheKey, {
            path: roadPath,
            meters: totalMeters,
          });

          const roadPoly = new google.maps.Polyline({
            map,
            path: roadPath,
            ...routePolylineOptions(strokeColor),
          });
          polylinesByVehicleRef.current[route.vehicleId] = roadPoly;
        } catch (err) {
          console.warn(
            "[Map] DirectionsService failed, falling back to straight line:",
            err,
          );
          drawFallback(route, strokeColor);
        }
      }),
    );

    return () => {
      cancelled = true;
      Object.values(polylinesByVehicleRef.current).forEach((p) =>
        p.setMap(null),
      );
      polylinesByVehicleRef.current = {};
    };
  }, [map, routes, onRouteDistanceUpdate]);

  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    const byVehicle = polylinesByVehicleRef.current;

    if (pendingPinMove) {
      const route = routes.find(
        (r) => r.vehicleId === pendingPinMove.vehicleId,
      );
      if (!route) return;
      const poly = byVehicle[pendingPinMove.vehicleId];
      if (!poly) return;
      const draftPath = buildRoutePath(route, pendingPinMove);
      if (draftPath.length >= 2) poly.setPath(draftPath);
      return;
    }

    for (const route of routes) {
      const poly = byVehicle[route.vehicleId];
      if (!poly) continue;
      const committed = buildRoutePath(route, null);
      if (committed.length < 2) continue;
      const key = routeCacheKey(committed);
      const cached = directionsCacheRef.current.get(key);
      if (cached && cached.path.length >= 2) {
        poly.setPath(cached.path);
      } else {
        poly.setPath(committed);
      }
    }
  }, [map, routes, pendingPinMove]);

  return null;
}

function latLngFromMarkerPosition(
  p: google.maps.marker.AdvancedMarkerElement["position"],
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
  onPendingPinMove: (
    vehicleId: string,
    stopId: string,
    lat: number,
    lng: number,
  ) => void;
  onRouteDistanceUpdate?: (vehicleId: string, distanceMi: number) => void;
};

type AdvancedMarkersProps = {
  map: google.maps.Map | null;
  routes: Route[];
  isEditMode: boolean;
  pendingPinMove: PendingPinMove | null;
  onPendingPinMove: (
    vehicleId: string,
    stopId: string,
    lat: number,
    lng: number,
  ) => void;
  onStopHover: (info: HoveredStopInfo) => void;
  onStopHoverEnd: () => void;
};

function stopKey(vehicleId: string, stopId: string): string {
  return `${vehicleId}:${stopId}`;
}

function hoverInfoForStop(
  routeIndex: number,
  route: Route,
  stop: Stop,
  pendingPinMove: PendingPinMove | null,
): HoveredStopInfo {
  const atPending =
    pendingPinMove != null &&
    pendingPinMove.vehicleId === route.vehicleId &&
    pendingPinMove.stopId === stop.id;
  return {
    routeIndex,
    stop,
    lat: atPending ? pendingPinMove.lat : stop.lat,
    lng: atPending ? pendingPinMove.lng : stop.lng,
  };
}

function bindAdvancedMarkerHover(
  marker: google.maps.marker.AdvancedMarkerElement,
  info: HoveredStopInfo,
  onStopHover: (info: HoveredStopInfo) => void,
  onStopHoverEnd: () => void,
): () => void {
  const show = () => onStopHover(info);
  const hide = () => onStopHoverEnd();
  const overListener = marker.addListener("mouseover", show);
  const outListener = marker.addListener("mouseout", hide);
  const el = marker.element;
  el?.addEventListener("mouseenter", show);
  el?.addEventListener("mouseleave", hide);
  return () => {
    google.maps.event.removeListener(overListener);
    google.maps.event.removeListener(outListener);
    el?.removeEventListener("mouseenter", show);
    el?.removeEventListener("mouseleave", hide);
  };
}

const DEPOT_MARKER_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><defs><filter id="sh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/></filter></defs><circle cx="14" cy="14" r="12" fill="#374151" stroke="#fff" stroke-width="2" filter="url(#sh)"/><text x="14" y="18.5" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="sans-serif">S</text></svg>`,
)}`;

function AdvancedMarkers({
  map,
  routes,
  isEditMode,
  pendingPinMove,
  onPendingPinMove,
  onStopHover,
  onStopHoverEnd,
}: AdvancedMarkersProps) {
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const markerByStopKeyRef = useRef<
    Record<string, google.maps.marker.AdvancedMarkerElement>
  >({});
  const hoverCleanupRef = useRef<(() => void)[]>([]);
  const pendingPinMoveRef = useRef(pendingPinMove);
  const onStopHoverRef = useRef(onStopHover);
  const onStopHoverEndRef = useRef(onStopHoverEnd);

  useEffect(() => {
    onStopHoverRef.current = onStopHover;
    onStopHoverEndRef.current = onStopHoverEnd;
  }, [onStopHover, onStopHoverEnd]);

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
        const { AdvancedMarkerElement } = (await google.maps.importLibrary(
          "marker",
        )) as google.maps.MarkerLibrary;

        if (cancelled) return;

        routes.forEach((route, routeIndex) => {
          const accentColor = routeColorHex(routeIndex);
          // Depot marker — distinct non-draggable pin labeled "S"
          if (route.startLocation) {
            const depotEl = document.createElement("img");
            depotEl.src = DEPOT_MARKER_SVG;
            depotEl.width = 28;
            depotEl.height = 28;
            depotEl.alt = "";
            const depotMarker = new AdvancedMarkerElement({
              map,
              position: {
                lat: route.startLocation.lat,
                lng: route.startLocation.lng,
              },
              content: depotEl,
              gmpDraggable: false,
            });
            markers.push(depotMarker);
          }

          const sorted = [...route.stops].sort(
            (a, b) => a.sequence - b.sequence,
          );
          sorted.forEach((stop) => {
            const position = { lat: stop.lat, lng: stop.lng };

            const m = new AdvancedMarkerElement({
              map,
              position,
              gmpDraggable: isEditMode,
              content: createRoutePinElement(accentColor),
            });

            m.addListener("dragend", () => {
              const ll = latLngFromMarkerPosition(m.position);
              if (!ll) return;
              onPendingPinMove(route.vehicleId, stop.id, ll.lat, ll.lng);
            });
            m.addListener("dragstart", () => {
              onStopHoverEndRef.current();
            });

            const hoverCleanup = bindAdvancedMarkerHover(
              m,
              hoverInfoForStop(
                routeIndex,
                route,
                stop,
                pendingPinMoveRef.current,
              ),
              (info) => onStopHoverRef.current(info),
              () => onStopHoverEndRef.current(),
            );
            hoverCleanupRef.current.push(hoverCleanup);

            markers.push(m);
            markerByStopKeyRef.current[stopKey(route.vehicleId, stop.id)] = m;
          });
        });

        if (cancelled) {
          hoverCleanupRef.current.forEach((cleanup) => cleanup());
          hoverCleanupRef.current = [];
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
      hoverCleanupRef.current.forEach((cleanup) => cleanup());
      hoverCleanupRef.current = [];
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
      const m =
        markerByStopKeyRef.current[
          stopKey(pendingPinMove.vehicleId, pendingPinMove.stopId)
        ];
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
  const [hoveredStop, setHoveredStop] = useState<HoveredStopInfo | null>(null);

  const handleStopHover = useCallback((info: HoveredStopInfo) => {
    setHoveredStop(info);
  }, []);

  const handleStopHoverEnd = useCallback(() => {
    setHoveredStop(null);
  }, []);

  const displayedHoveredStop = useMemo((): HoveredStopInfo | null => {
    if (!hoveredStop) return null;
    if (!pendingPinMove) return hoveredStop;
    const route = routes[hoveredStop.routeIndex];
    if (
      !route ||
      pendingPinMove.vehicleId !== route.vehicleId ||
      pendingPinMove.stopId !== hoveredStop.stop.id
    ) {
      return hoveredStop;
    }
    return {
      ...hoveredStop,
      lat: pendingPinMove.lat,
      lng: pendingPinMove.lng,
    };
  }, [hoveredStop, pendingPinMove, routes]);

  const onMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      if (routes.length === 0) return;
      const bounds = new google.maps.LatLngBounds();
      routes.forEach((route) => {
        route.stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
        if (route.startLocation) {
          bounds.extend({
            lat: route.startLocation.lat,
            lng: route.startLocation.lng,
          });
        }
      });
      mapInstance.fitBounds(bounds, 48);
    },
    [routes],
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
    [mapId],
  );

  if (!apiKey) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-zinc-100 text-zinc-600">
        Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-lg">
      <LoadScriptNext
        googleMapsApiKey={apiKey}
        mapIds={mapId ? [mapId] : undefined}
        loadingElement={
          <div className="min-h-[70vh] bg-zinc-100 animate-pulse rounded-lg" />
        }
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
          <MapStopHoverOverlay hovered={displayedHoveredStop} />
          {mapId && (
            <AdvancedMarkers
              map={map}
              routes={routes}
              isEditMode={isEditMode}
              pendingPinMove={pendingPinMove}
              onPendingPinMove={onPendingPinMove}
              onStopHover={handleStopHover}
              onStopHoverEnd={handleStopHoverEnd}
            />
          )}
          {!mapId &&
            routes.map((route, routeIndex) => {
              const accentColor = routeColorHex(routeIndex);
              const iconUrl = markerSvgDataUrl(accentColor);
              const scaledSize = getMarkerScaledSize();
              const sorted = [...route.stops].sort(
                (a, b) => a.sequence - b.sequence,
              );
              return (
                <Fragment key={route.vehicleId}>
                  {route.startLocation && (
                    <Marker
                      key={`depot-${route.vehicleId}`}
                      position={{
                        lat: route.startLocation.lat,
                        lng: route.startLocation.lng,
                      }}
                      draggable={false}
                      icon={
                        typeof google !== "undefined"
                          ? {
                              url: DEPOT_MARKER_SVG,
                              scaledSize: new google.maps.Size(28, 28),
                              anchor: new google.maps.Point(14, 14),
                            }
                          : undefined
                      }
                    />
                  )}
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
                        icon={
                          scaledSize
                            ? {
                                url: iconUrl,
                                scaledSize,
                                anchor: new google.maps.Point(
                                  MARKER_ICON_WIDTH / 2,
                                  MARKER_ICON_HEIGHT,
                                ),
                              }
                            : { url: iconUrl }
                        }
                        draggable={isEditMode}
                        onMouseOver={() =>
                          handleStopHover({
                            routeIndex,
                            stop,
                            lat: position.lat,
                            lng: position.lng,
                          })
                        }
                        onMouseOut={handleStopHoverEnd}
                        onDragEnd={(e) => {
                          const latLng = e.latLng;
                          if (!latLng) return;
                          onPendingPinMove(
                            route.vehicleId,
                            stop.id,
                            latLng.lat(),
                            latLng.lng(),
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
