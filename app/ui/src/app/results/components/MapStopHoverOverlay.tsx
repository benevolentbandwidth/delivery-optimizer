"use client";

import { default as React, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGoogleMap } from "@react-google-maps/api";
import type { HoveredStopInfo } from "../types";
import StopHoverCard from "./StopHoverCard";

type MapStopHoverOverlayProps = {
  hovered: HoveredStopInfo | null;
};

function useContainerPixelPosition(
  map: google.maps.Map | null,
  lat: number,
  lng: number,
): { x: number; y: number } | null {
  const [pixel, setPixel] = useState<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const latLngRef = useRef({ lat, lng });

  useEffect(() => {
    if (!map) return;

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => {};
    overlay.draw = () => {};
    overlay.setMap(map);
    overlayRef.current = overlay;

    const update = () => {
      const projection = overlay.getProjection();
      if (!projection) return;
      const { lat, lng } = latLngRef.current;
      const point = projection.fromLatLngToContainerPixel(
        new google.maps.LatLng(lat, lng),
      );
      if (point) setPixel({ x: point.x, y: point.y });
    };

    const idleListener = map.addListener("idle", update);
    const boundsListener = map.addListener("bounds_changed", update);
    update();

    return () => {
      google.maps.event.removeListener(idleListener);
      google.maps.event.removeListener(boundsListener);
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    latLngRef.current = { lat, lng };

    const overlay = overlayRef.current;
    if (!overlay) return;

    const projection = overlay.getProjection();
    if (!projection) return;

    const point = projection.fromLatLngToContainerPixel(
      new google.maps.LatLng(lat, lng),
    );
    if (point) setPixel({ x: point.x, y: point.y });
  }, [lat, lng]);

  return pixel;
}

function PositionedStopHoverCard({ hovered }: { hovered: HoveredStopInfo }) {
  const map = useGoogleMap();
  const pixel = useContainerPixelPosition(
    map ?? null,
    hovered.lat,
    hovered.lng,
  );

  if (!map || !pixel) return null;

  const mapDiv = map.getDiv();
  if (!mapDiv) return null;

  return createPortal(
    <div
      className="pointer-events-none absolute z-20 transition-[transform,opacity] duration-200 ease-out"
      style={{
        left: pixel.x,
        top: pixel.y,
        transform: "translate(-50%, calc(-100% - 88px))",
      }}
    >
      <StopHoverCard
        routeLabel={`Route ${hovered.routeIndex + 1}, Stop ${hovered.stop.sequence}`}
        stop={hovered.stop}
      />
    </div>,
    mapDiv,
  );
}

export default function MapStopHoverOverlay({
  hovered,
}: MapStopHoverOverlayProps) {
  if (!hovered) return null;
  return <PositionedStopHoverCard hovered={hovered} />;
}
