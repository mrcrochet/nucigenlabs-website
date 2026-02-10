/**
 * Global Situation Map – Overview (Google Earth–style)
 * Globe 3D avec rotation idle, fog, marqueurs pulsants, presets layers, tooltips.
 */

import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { OverviewSignal, OverviewSignalType } from '../../types/overview';
import { Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { OVERVIEW_LAYER_SEMANTICS, OVERVIEW_MAP_MAX_SIGNALS } from '../../constants/overview-signals';
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

const VIEW_PRESETS: { id: string; label: string; layers: OverviewSignalType[] }[] = [
  { id: 'geopolitics', label: 'Geopolitics', layers: ['geopolitics', 'security'] },
  { id: 'supply', label: 'Supply Chain', layers: ['supply-chains', 'energy'] },
  { id: 'markets', label: 'Markets', layers: ['markets'] },
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

const LAYER_OPTIONS = (Object.entries(OVERVIEW_LAYER_SEMANTICS) as [OverviewSignalType, typeof OVERVIEW_LAYER_SEMANTICS[OverviewSignalType]][])
  .map(([id, { label, color }]) => ({ id, label, color }));

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
  /** Default: geopolitics, supply-chains */
  defaultLayers?: OverviewSignalType[];
  /** When set, called on point click instead of navigating to investigate_id */
  onSignalClick?: (signal: OverviewSignal) => void;
}

export interface GlobalSituationMapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
}

const GlobalSituationMapInner = forwardRef<GlobalSituationMapHandle, GlobalSituationMapProps>(
  function GlobalSituationMapInner(
    {
      signals,
      defaultLayers = ['geopolitics', 'supply-chains'],
      onSignalClick,
    },
    ref
  ) {
  const navigate = useNavigate();
  const mapRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (lng: number, lat: number, zoom = 4) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;
      map.flyTo({ center: [lng, lat], zoom, duration: 1200, essential: true });
    },
  }), []);
  const [selectedLayers, setSelectedLayers] = useState<OverviewSignalType[]>(defaultLayers);
  const [hoveredSignal, setHoveredSignal] = useState<OverviewSignal | null>(null);
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationFrameRef = useRef<number | null>(null);
  const isIdleRef = useRef(false);

  const toggleLayer = useCallback((id: OverviewSignalType) => {
    setSelectedLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }, []);

  const applyPreset = useCallback((layers: OverviewSignalType[]) => {
    setSelectedLayers(layers);
  }, []);

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

  // V1 product rule: max 8–12 signals visible so the map answers "where to look" at a glance
  const filteredSignals = signals
    .filter((s) => selectedLayers.includes(s.type))
    .slice(0, OVERVIEW_MAP_MAX_SIGNALS);

  const handleSignalClick = useCallback(
    (signal: OverviewSignal) => {
      if (onSignalClick) {
        onSignalClick(signal);
        return;
      }
      const path = signal.investigate_id || '/search';
      navigate(path);
    },
    [navigate, onSignalClick]
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
      {/* Layer toggles – bottom left (so right panel doesn’t cover them) */}
      <div className="absolute bottom-3 left-3 z-10">
        {layersPanelOpen ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-xl p-3 shadow-xl ring-1 ring-white/[0.06]">
            <button
              type="button"
              onClick={() => setLayersPanelOpen(false)}
              className="w-full flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10"
              aria-label="Rétracter Layers"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-300 uppercase tracking-wider font-medium">
                  Layers
                </span>
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
            </button>
            <div className="flex flex-wrap gap-1.5 mb-2">
          {VIEW_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.layers)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors bg-white/10 text-gray-300 hover:bg-white/20"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {LAYER_OPTIONS.map((layer) => {
            const isOn = selectedLayers.includes(layer.id);
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className="flex items-center gap-2 w-full text-left group rounded-md py-1 pr-1 transition-colors hover:bg-white/[0.06]"
                aria-pressed={isOn}
                aria-label={`${layer.label} layer ${isOn ? 'on' : 'off'}`}
              >
                <span
                  className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-[background-color] duration-200"
                  style={{
                    backgroundColor: isOn ? `${layer.color}40` : 'rgba(255,255,255,0.1)',
                    boxShadow: isOn ? `0 0 12px ${layer.color}50` : 'none',
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-white/90 shadow-sm transition-transform duration-200 mt-0.5 ml-0.5"
                    style={{
                      transform: isOn ? 'translateX(1rem)' : 'translateX(0)',
                      backgroundColor: isOn ? layer.color : 'rgba(255,255,255,0.6)',
                    }}
                  />
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-300">
                  {layer.label}
                </span>
              </button>
            );
          })}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLayersPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-xl shadow-xl hover:bg-white/[0.1] transition-colors text-left ring-1 ring-white/[0.06]"
            aria-label="Afficher Layers"
          >
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
            <Layers className="w-3.5 h-3.5 text-gray-400" aria-hidden />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">Layers</span>
          </button>
        )}
      </div>

      <Map
        ref={mapRef}
        onLoad={onMapLoad}
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
        {filteredSignals.map((signal) => {
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
              onClick={() => handleSignalClick(signal)}
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
      </Map>
    </div>
  );
});

export default GlobalSituationMapInner;
