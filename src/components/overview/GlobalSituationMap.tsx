/**
 * Global Situation Map – Overview V1
 * Mapbox GL map with signals as points; layers, hover tooltip, click → Investigate.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { OverviewSignal, OverviewSignalType } from '../../types/overview';
import { Layers } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

const LAYER_OPTIONS: { id: OverviewSignalType; label: string; color: string }[] = [
  { id: 'geopolitics', label: 'Geopolitics', color: '#ca8a04' },
  { id: 'supply-chains', label: 'Supply Chains', color: '#ea580c' },
  { id: 'markets', label: 'Markets', color: '#2563eb' },
  { id: 'energy', label: 'Energy', color: '#d97706' },
  { id: 'security', label: 'Security', color: '#dc2626' },
];

function typeToColor(type: OverviewSignalType): string {
  return LAYER_OPTIONS.find((l) => l.id === type)?.color ?? '#71717a';
}

function importanceToSize(importance: number): number {
  return 6 + (importance / 100) * 10;
}

function impactToHaloPx(impact: OverviewSignal['impact']): number {
  switch (impact) {
    case 'global':
      return 24;
    case 'regional':
      return 16;
    default:
      return 10;
  }
}

export interface GlobalSituationMapProps {
  signals: OverviewSignal[];
  /** Default: geopolitics, supply-chains */
  defaultLayers?: OverviewSignalType[];
}

export default function GlobalSituationMap({
  signals,
  defaultLayers = ['geopolitics', 'supply-chains'],
}: GlobalSituationMapProps) {
  const navigate = useNavigate();
  const [selectedLayers, setSelectedLayers] = useState<OverviewSignalType[]>(defaultLayers);
  const [hoveredSignal, setHoveredSignal] = useState<OverviewSignal | null>(null);

  const toggleLayer = useCallback((id: OverviewSignalType) => {
    setSelectedLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }, []);

  // V1 product rule: max 8–12 signals visible so the map answers "where to look" at a glance
  const filteredSignals = signals
    .filter((s) => selectedLayers.includes(s.type))
    .slice(0, 12);

  const handleSignalClick = useCallback(
    (signal: OverviewSignal) => {
      const path = signal.investigate_id || '/investigations';
      navigate(path);
    },
    [navigate]
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
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-gray-800 bg-[#0a0a0a]">
      {/* Layer toggles – top right */}
      <div className="absolute top-3 right-3 z-10 bg-black/80 backdrop-blur-sm border border-gray-800 p-3 rounded">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
          <Layers className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Layers
          </span>
        </div>
        <div className="space-y-2">
          {LAYER_OPTIONS.map((layer) => (
            <label
              key={layer.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={() => toggleLayer(layer.id)}
                className="w-3 h-3 rounded border-gray-600"
              />
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-xs text-gray-400 group-hover:text-gray-300">
                {layer.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Map
        mapboxAccessToken={MAPBOX_TOKEN!}
        initialViewState={{
          longitude: 20,
          latitude: 25,
          zoom: 1.5,
        }}
        style={{ width: '100%', height: '100%', minHeight: 400 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        {filteredSignals.map((signal) => {
          const color = typeToColor(signal.type);
          const size = importanceToSize(signal.importance);
          const halo = impactToHaloPx(signal.impact);
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
                  width: halo * 2,
                  height: halo * 2,
                  marginLeft: -halo,
                  marginTop: -halo,
                }}
              >
                {/* Halo */}
                <div
                  className="absolute inset-0 rounded-full opacity-30"
                  style={{
                    backgroundColor: color,
                  }}
                />
                {/* Point */}
                <div
                  className="absolute rounded-full border-2 border-black/50"
                  style={{
                    width: size,
                    height: size,
                    left: halo - size / 2,
                    top: halo - size / 2,
                    backgroundColor: color,
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
            className="global-situation-popup"
          >
            <div className="text-left text-xs text-gray-200 min-w-[180px]">
              <div className="font-medium text-gray-100">{hoveredSignal.label_short}</div>
              <div className="text-gray-400 mt-0.5">{hoveredSignal.subtitle_short}</div>
              <div className="mt-1.5">
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
}
