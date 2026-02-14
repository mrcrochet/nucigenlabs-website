/**
 * Global Situation Map – Overview (Google Earth–style)
 * GeoJSON circle layer + custom InfoPanel anchored via map.project().
 * No Mapbox Popup; stable positioning on zoom/rotate.
 */

import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { OverviewSignal } from '../../types/overview';
import { OVERVIEW_MAP_MAX_SIGNALS } from '../../constants/overview-signals';
import { useMapProjection } from '../../hooks/useMapProjection';
import OverviewInfoPanel from './OverviewInfoPanel';

const IDLE_ROTATION_DELAY_MS = 2500;
const IDLE_BEARING_SPEED = 0.05;

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

const SOURCE_ID = 'overview-signals';
const LAYER_ID = 'overview-circles';

function signalsToGeoJSON(signals: OverviewSignal[]) {
  return {
    type: 'FeatureCollection' as const,
    features: signals.map((s) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [s.lon, s.lat],
      },
      properties: {
        id: s.id,
        type: s.type,
        importance: s.importance,
      },
    })),
  };
}

export interface GlobalSituationMapProps {
  signals: OverviewSignal[];
  onSignalClick?: (signal: OverviewSignal) => void;
}

export interface GlobalSituationMapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  selectSignal: (signal: OverviewSignal) => void;
}

type MapInstance = Parameters<typeof useMapProjection>[0];

const GlobalSituationMapInner = forwardRef<GlobalSituationMapHandle, GlobalSituationMapProps>(
  function GlobalSituationMapInner({ signals, onSignalClick }, ref) {
    const mapRef = useRef<any>(null);
    const [mapInstance, setMapInstance] = useState<MapInstance | null>(null);
    const [selectedSignal, setSelectedSignal] = useState<OverviewSignal | null>(null);
    const signalsRef = useRef<OverviewSignal[]>([]);
    signalsRef.current = signals;

    const screenPos = useMapProjection(
      mapInstance,
      selectedSignal ? { lng: selectedSignal.lon, lat: selectedSignal.lat } : null
    );

    const doFlyTo = useCallback((lng: number, lat: number, zoom?: number) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;
      const currentZoom = map.getZoom();
      map.flyTo({
        center: [lng, lat],
        zoom: zoom ?? currentZoom + 1.5,
        duration: 1200,
        essential: true,
      });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        flyTo: doFlyTo,
        selectSignal: (signal: OverviewSignal) => {
          setSelectedSignal(signal);
          doFlyTo(signal.lon, signal.lat);
        },
      }),
      [doFlyTo]
    );

    const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rotationFrameRef = useRef<number | null>(null);
    const isIdleRef = useRef(false);
    const mapCleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      setSelectedSignal(null);
    }, [signals]);

    const onMapLoad = useCallback(() => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;
      mapCleanupRef.current?.();
      mapCleanupRef.current = null;
      setMapInstance(map);

      // Force flat dark atmosphere (override style's default gradient/starfield)
      const setFlatFog = () => {
        try {
          const style = map.getStyle();
          if (style?.layers) {
            style.layers.forEach((l: { type?: string; id?: string }) => {
              if (l.type === 'sky') map.removeLayer(l.id);
            });
          }
          map.setFog({
            range: [0.5, 10],
            color: 'rgb(10, 10, 15)',
            'high-color': 'rgb(10, 10, 15)',
            'horizon-blend': 0,
            'space-color': 'rgb(10, 10, 15)',
            'star-intensity': 0,
          });
        } catch (_) {
          /* style not ready */
        }
      };
      setFlatFog();
      map.once('style.load', setFlatFog);

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

      const handleCircleClick = (e: { features?: Array<{ properties?: { id?: string } }> }) => {
        const features = e.features;
        if (!features?.length) return;
        const id = features[0].properties?.id;
        if (!id) return;
        const signal = signalsRef.current.find((s) => s.id === id);
        if (!signal) return;

        if (onSignalClick) {
          onSignalClick(signal);
          return;
        }
        setSelectedSignal(signal);
        doFlyTo(signal.lon, signal.lat);
      };

      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };
      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      map.on('movestart', stopIdleRotation);
      map.on('moveend', scheduleIdle);
      map.on('click', LAYER_ID, handleCircleClick);
      map.on('mouseenter', LAYER_ID, handleMouseEnter);
      map.on('mouseleave', LAYER_ID, handleMouseLeave);
      scheduleIdle();

      mapCleanupRef.current = () => {
        map.off('movestart', stopIdleRotation);
        map.off('moveend', scheduleIdle);
        map.off('click', LAYER_ID, handleCircleClick);
        map.off('mouseenter', LAYER_ID, handleMouseEnter);
        map.off('mouseleave', LAYER_ID, handleMouseLeave);
      };
    }, [onSignalClick, doFlyTo]);

    useEffect(() => {
      return () => {
        mapCleanupRef.current?.();
        mapCleanupRef.current = null;
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        if (rotationFrameRef.current != null) cancelAnimationFrame(rotationFrameRef.current);
      };
    }, []);

    const visibleSignals = signals.slice(0, OVERVIEW_MAP_MAX_SIGNALS);
    const geojson = signalsToGeoJSON(visibleSignals);

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
          mapboxAccessToken={MAPBOX_TOKEN!}
          initialViewState={{
            longitude: 20,
            latitude: 25,
            zoom: 1.2,
          }}
          projection="globe"
          style={{ width: '100%', height: '100%', minHeight: 400 }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          attributionControl={false}
        >
          <Source id={SOURCE_ID} type="geojson" data={geojson}>
            <Layer
              id={LAYER_ID}
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['get', 'importance'],
                  0,
                  8,
                  34,
                  14,
                  67,
                  24,
                  100,
                  28,
                ],
                'circle-color': [
                  'match',
                  ['get', 'type'],
                  'security',
                  '#EF4444',
                  'supply-chains',
                  '#FF6B35',
                  'energy',
                  '#FBBF24',
                  'markets',
                  '#D946EF',
                  'geopolitics',
                  '#71717a',
                  '#71717a',
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.9,
              }}
            />
          </Source>
        </Map>

        {selectedSignal && (
          <div
            className="absolute inset-0 z-[5]"
            data-overview-panel
            onClick={() => setSelectedSignal(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <OverviewInfoPanel
                signal={selectedSignal}
                x={screenPos.x}
                y={screenPos.y}
                isVisible={screenPos.isVisible}
                onClose={() => setSelectedSignal(null)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default GlobalSituationMapInner;
