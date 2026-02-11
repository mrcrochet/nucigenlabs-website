/**
 * DiscoverMiniGlobe — compact globe showing Overview signals above the feed.
 * Click a signal → parent injects label_short into searchQuery to filter the feed.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { OverviewSignal } from '../../types/overview';
import { getOverviewMapData, FALLBACK_DATA } from '../../lib/api/overview-api';
import {
  getLayerColor,
  getMarkerGlowShadow,
  importanceToMarkerSizePx,
} from '../../utils/colorSystem';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

const IDLE_ROTATION_DELAY_MS = 2500;
const IDLE_BEARING_SPEED = 0.05;

const FOG_CONFIG = {
  range: [0.5, 10],
  color: 'rgb(10, 10, 15)',
  'high-color': 'rgb(45, 35, 20)',
  'horizon-blend': 0.4,
  'space-color': 'rgb(8, 6, 12)',
  'star-intensity': 0.15,
};

function importanceToHaloRadiusPx(importance: number): number {
  return importanceToMarkerSizePx(importance) / 2;
}

function importanceToDotPx(importance: number): number {
  const d = importanceToMarkerSizePx(importance);
  return Math.max(6, Math.round(d * 0.2));
}

export interface DiscoverMiniGlobeProps {
  onSignalClick?: (searchTerm: string) => void;
  className?: string;
}

export default function DiscoverMiniGlobe({ onSignalClick, className }: DiscoverMiniGlobeProps) {
  const mapRef = useRef<any>(null);
  const [signals, setSignals] = useState<OverviewSignal[]>([]);
  const [hoveredSignal, setHoveredSignal] = useState<OverviewSignal | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationFrameRef = useRef<number | null>(null);
  const isIdleRef = useRef(false);

  // Fetch overview signals
  useEffect(() => {
    let cancelled = false;
    getOverviewMapData()
      .then((data) => {
        if (!cancelled) setSignals(data.signals.slice(0, 12));
      })
      .catch(() => {
        if (!cancelled) setSignals(FALLBACK_DATA.signals);
      });
    return () => { cancelled = true; };
  }, []);

  // Idle rotation
  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const startIdleRotation = () => {
      isIdleRef.current = true;
      const rotate = () => {
        if (!isIdleRef.current || !mapRef.current) return;
        const m = mapRef.current.getMap?.();
        if (!m) return;
        const c = m.getCenter();
        m.easeTo({
          center: [c.lng + IDLE_BEARING_SPEED, c.lat],
          duration: 100,
          essential: true,
        });
        rotationFrameRef.current = requestAnimationFrame(rotate);
      };
      rotationFrameRef.current = requestAnimationFrame(rotate);
    };

    const stopIdleRotation = () => {
      isIdleRef.current = false;
      if (rotationFrameRef.current != null) {
        cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
    };

    const scheduleIdle = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      stopIdleRotation();
      idleTimeoutRef.current = setTimeout(startIdleRotation, IDLE_ROTATION_DELAY_MS);
    };

    map.on('movestart', stopIdleRotation);
    map.on('moveend', scheduleIdle);
    scheduleIdle();
  }, []);

  // Cleanup rotation timers
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (rotationFrameRef.current != null) cancelAnimationFrame(rotationFrameRef.current);
    };
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-[#0a0a0a] text-slate-500 h-[280px] ${className ?? ''}`}>
        <p className="text-sm">Set VITE_MAPBOX_ACCESS_TOKEN to enable the mini-globe.</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[280px] bg-[#0a0a0f] ${className ?? ''}`}>
      <Map
        ref={mapRef}
        onLoad={onMapLoad}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 20, latitude: 25, zoom: 1.2 }}
        projection="globe"
        fog={FOG_CONFIG}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        {signals.map((signal) => {
          const color = getLayerColor(signal.type, 'main');
          const halo = importanceToHaloRadiusPx(signal.importance);
          const dotPx = importanceToDotPx(signal.importance);
          const diameter = halo * 2;
          return (
            <Marker
              key={signal.id}
              longitude={signal.lon}
              latitude={signal.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSignalClick?.(signal.label_short);
              }}
            >
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredSignal(signal)}
                onMouseLeave={() => setHoveredSignal(null)}
                style={{
                  width: diameter,
                  height: diameter,
                  marginLeft: -halo,
                  marginTop: -halo,
                  filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.3))',
                }}
              >
                <div
                  className="overview-marker-halo absolute inset-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div
                  className="overview-marker-dot absolute rounded-full border-2 border-white/30"
                  style={{
                    width: dotPx,
                    height: dotPx,
                    left: halo - dotPx / 2,
                    top: halo - dotPx / 2,
                    backgroundColor: color,
                    boxShadow: getMarkerGlowShadow(signal.type),
                  }}
                />
              </div>
            </Marker>
          );
        })}

        {hoveredSignal && (
          <Popup
            longitude={hoveredSignal.lon}
            latitude={hoveredSignal.lat}
            anchor="bottom"
            closeButton={false}
            onClose={() => setHoveredSignal(null)}
            className="discover-globe-popup"
          >
            <div className="text-left text-xs text-gray-200 min-w-[180px]">
              <div className="font-medium text-gray-100">{hoveredSignal.label_short}</div>
              <div className="text-gray-400 mt-0.5">{hoveredSignal.subtitle_short}</div>
              <div className="mt-1.5 pt-1.5 border-t border-white/10">
                <span className="text-gray-500">Impact:</span>{' '}
                <span className="text-gray-300">{hoveredSignal.impact_one_line}</span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
