/**
 * Global Situation Map – Overview (Google Earth–style)
 * Globe 3D avec rotation idle, fog, marqueurs pulsants, detail popup, tooltips.
 */

import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { OverviewSignal, OverviewSignalType } from '../../types/overview';
import { OVERVIEW_LAYER_SEMANTICS } from '../../constants/overview-signals';
import {
  getLayerColor,
  getMarkerGlowShadow,
  importanceToMarkerSizePx,
} from '../../utils/colorSystem';

const IDLE_ROTATION_DELAY_MS = 2500;
/** ~0.5 deg/sec for smooth idle rotation */
const IDLE_BEARING_SPEED = 0.05;

/** Fog with orange/gold atmospheric tint (no blue) */
const FOG_CONFIG = {
  range: [0.5, 10],
  color: 'rgb(10, 10, 15)',
  'high-color': 'rgb(45, 35, 20)',
  'horizon-blend': 0.4,
  'space-color': 'rgb(8, 6, 12)',
  'star-intensity': 0.15,
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

function typeToColor(type: OverviewSignalType): string {
  return getLayerColor(type, 'main');
}

/** Outer diameter from importance band (40 / 60 / 80px); halo radius = half. */
function importanceToHaloRadiusPx(importance: number): number {
  return importanceToMarkerSizePx(importance) / 2;
}

/** Inner dot size ~20% of diameter (8 / 12 / 16px). */
function importanceToDotPx(importance: number): number {
  const d = importanceToMarkerSizePx(importance);
  return Math.max(6, Math.round(d * 0.2));
}

export interface GlobalSituationMapProps {
  signals: OverviewSignal[];
  /** When set, called on point click instead of navigating to investigate_id */
  onSignalClick?: (signal: OverviewSignal) => void;
}

export interface GlobalSituationMapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  /** Select a signal programmatically (flyTo + open detail popup) */
  selectSignal: (signal: OverviewSignal) => void;
}

const GlobalSituationMapInner = forwardRef<GlobalSituationMapHandle, GlobalSituationMapProps>(
  function GlobalSituationMapInner(
    {
      signals,
      onSignalClick,
    },
    ref
  ) {
  const navigate = useNavigate();
  const mapRef = useRef<any>(null);
  const [hoveredSignal, setHoveredSignal] = useState<OverviewSignal | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<OverviewSignal | null>(null);

  const doFlyTo = useCallback((lng: number, lat: number, zoom = 4) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom, duration: 1200, essential: true });
  }, []);

  useImperativeHandle(ref, () => ({
    flyTo: doFlyTo,
    selectSignal: (signal: OverviewSignal) => {
      setSelectedSignal(signal);
      doFlyTo(signal.lon, signal.lat, 4);
    },
  }), [doFlyTo]);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationFrameRef = useRef<number | null>(null);
  const isIdleRef = useRef(false);

  // Clear selectedSignal when signals prop changes (new data from server)
  useEffect(() => {
    setSelectedSignal(null);
  }, [signals]);

  // Idle rotation when map is ready
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

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (rotationFrameRef.current != null) cancelAnimationFrame(rotationFrameRef.current);
    };
  }, []);

  // Server already caps to 12; guard just in case
  const visibleSignals = signals.slice(0, 12);

  const handleSignalClick = useCallback(
    (signal: OverviewSignal) => {
      if (onSignalClick) {
        onSignalClick(signal);
        return;
      }
      setSelectedSignal(signal);
      const map = mapRef.current?.getMap?.();
      if (map) {
        map.flyTo({ center: [signal.lon, signal.lat], zoom: 4, duration: 1200, essential: true });
      }
    },
    [onSignalClick]
  );


  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="flex items-center justify-center bg-[#0a0a0a] border border-gray-800 text-gray-500"
        style={{ minHeight: 400 }}
      >
        <div className="text-center text-sm">
          <p className="font-medium text-gray-400">Global Situation</p>
          <p className="mt-1">Set VITE_MAPBOX_ACCESS_TOKEN to enable the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-[#0a0a0f]">
      <Map
        ref={mapRef}
        onLoad={onMapLoad}
        onClick={() => setSelectedSignal(null)}
        mapboxAccessToken={MAPBOX_TOKEN!}
        initialViewState={{
          longitude: 20,
          latitude: 25,
          zoom: 1.2,
        }}
        projection="globe"
        fog={FOG_CONFIG}
        style={{ width: '100%', height: '100%', minHeight: 400 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        {visibleSignals.map((signal) => {
          const color = typeToColor(signal.type);
          const halo = importanceToHaloRadiusPx(signal.importance);
          const dotPx = importanceToDotPx(signal.importance);
          const diameter = halo * 2;
          return (
            <Marker
              key={signal.id}
              longitude={signal.lon}
              latitude={signal.lat}
              anchor="center"
              onClick={(e) => { e.originalEvent.stopPropagation(); handleSignalClick(signal); }}
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

        {/* Hover tooltip — suppress when same signal is selected */}
        {hoveredSignal && hoveredSignal.id !== selectedSignal?.id && (
          <Popup
            longitude={hoveredSignal.lon}
            latitude={hoveredSignal.lat}
            anchor="bottom"
            closeButton={false}
            onClose={() => setHoveredSignal(null)}
            className="global-situation-popup overview-tooltip-entrance !bg-white/[0.1] !backdrop-blur-md !rounded-xl !shadow-2xl !p-3"
            style={{
              border: `1px solid ${getLayerColor(hoveredSignal.type, 'main')}40`,
            }}
          >
            <div className="text-left text-xs text-gray-200 min-w-[200px]">
              <div className="font-medium text-gray-100">{hoveredSignal.label_short}</div>
              <div className="text-gray-400 mt-0.5">{hoveredSignal.subtitle_short}</div>
              <div className="mt-1.5 pt-1.5 border-t border-white/10">
                <span className="text-gray-500">Impact:</span>{' '}
                <span className="text-gray-300">{hoveredSignal.impact_one_line}</span>
              </div>
              <div className="mt-1 text-gray-500">
                Confidence: <span className="font-mono text-gray-400">{hoveredSignal.confidence}%</span>
              </div>
            </div>
          </Popup>
        )}

        {/* Detail popup — persistent on marker click */}
        {selectedSignal && (
          <Popup
            longitude={selectedSignal.lon}
            latitude={selectedSignal.lat}
            anchor="bottom"
            closeButton
            onClose={() => setSelectedSignal(null)}
            className="global-situation-popup !bg-black/70 !backdrop-blur-xl !rounded-xl !shadow-2xl !p-0"
            style={{
              border: `1px solid ${getLayerColor(selectedSignal.type, 'main')}50`,
            }}
          >
            <div className="text-left text-xs text-gray-200 min-w-[220px] p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: `${OVERVIEW_LAYER_SEMANTICS[selectedSignal.type].color}25`,
                    color: OVERVIEW_LAYER_SEMANTICS[selectedSignal.type].color,
                    border: `1px solid ${OVERVIEW_LAYER_SEMANTICS[selectedSignal.type].color}40`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: OVERVIEW_LAYER_SEMANTICS[selectedSignal.type].color }}
                  />
                  {OVERVIEW_LAYER_SEMANTICS[selectedSignal.type].label}
                </span>
                <span className="text-[10px] font-mono text-gray-400 shrink-0">
                  {selectedSignal.confidence}%
                </span>
              </div>
              <div className="font-medium text-gray-100 text-sm leading-tight">{selectedSignal.label_short}</div>
              <div className="text-gray-400 mt-0.5">{selectedSignal.subtitle_short}</div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="text-gray-500">Impact:</span>{' '}
                <span className="text-gray-300">{selectedSignal.impact_one_line}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(selectedSignal.investigate_id || '/search')}
                className="mt-3 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-medium border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
              >
                Investigate
                <span aria-hidden>&rarr;</span>
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
});

export default GlobalSituationMapInner;
