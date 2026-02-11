/**
 * useMapProjection – Convert lng/lat to screen coordinates, sync on map move/zoom.
 * Keeps InfoPanel anchored to geographic position without drift.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface MapInstance {
  project: (c: [number, number]) => { x: number; y: number };
  getBounds: () => { getNorthEast: () => { lng: number; lat: number }; getSouthWest: () => { lng: number; lat: number } };
  on: (e: string, fn: () => void) => void;
  off: (e: string, fn: () => void) => void;
}

export interface UseMapProjectionResult {
  x: number;
  y: number;
  isVisible: boolean;
}

/** Throttle in ms for move/zoom updates */
const THROTTLE_MS = 16; // ~60fps

function project(
  map: NonNullable<MapInstance>,
  lng: number,
  lat: number
): { x: number; y: number; isVisible: boolean } {
  try {
    const point = map.project([lng, lat]);
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const isVisible =
      lng >= sw.lng && lng <= ne.lng && lat >= sw.lat && lat <= ne.lat;
    return { x: point.x, y: point.y, isVisible };
  } catch {
    return { x: 0, y: 0, isVisible: false };
  }
}

export function useMapProjection(
  map: MapInstance,
  coordinates: { lng: number; lat: number } | null
): UseMapProjectionResult {
  const [result, setResult] = useState<UseMapProjectionResult>({
    x: 0,
    y: 0,
    isVisible: false,
  });
  const throttleRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const update = useCallback(() => {
    if (!map || !coordinates) {
      setResult({ x: 0, y: 0, isVisible: false });
      return;
    }
    const next = project(map, coordinates.lng, coordinates.lat);
    setResult(next);
  }, [map, coordinates?.lng, coordinates?.lat]);

  useEffect(() => {
    if (!map || !coordinates) {
      setResult({ x: 0, y: 0, isVisible: false });
      return undefined;
    }

    update();

    const handleMove = () => {
      const now = Date.now();
      if (throttleRef.current != null) return;
      if (now - lastUpdateRef.current < THROTTLE_MS) {
        throttleRef.current = window.setTimeout(() => {
          throttleRef.current = null;
          lastUpdateRef.current = Date.now();
          update();
        }, THROTTLE_MS);
      } else {
        lastUpdateRef.current = now;
        update();
      }
    };

    map.on('move', handleMove);
    map.on('zoom', handleMove);
    map.on('pitch', handleMove);
    map.on('rotate', handleMove);

    return () => {
      map.off('move', handleMove);
      map.off('zoom', handleMove);
      map.off('pitch', handleMove);
      map.off('rotate', handleMove);
      if (throttleRef.current != null) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
    };
  }, [map, coordinates?.lng, coordinates?.lat, update]);

  return result;
}
