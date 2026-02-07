/**
 * Discover Globe View – Full-screen 3D globe with real-time event points.
 * Mission: orienter l'attention. Légende, snapshot, top signals, dynamiques.
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { eventToGeoPoint } from '../../lib/geo-coordinates';
import {
  GLOBE_CATEGORIES,
  GLOBE_CATEGORY_IDS,
  eventToGlobeCategory,
  eventImportance,
  eventImpactScope,
  impactScopeToHaloPx,
  importanceToSizePx,
  type GlobeCategory,
} from '../../constants/globe-semantics';
import { buildGlobalSnapshot, buildTopSignals, buildDynamics } from '../../lib/globe-snapshot';
import type { Event } from '../../types/intelligence';
import { Loader2, ArrowUp, ArrowRight, ArrowDown, Search, Sparkles, RefreshCw, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

export interface DiscoverGlobeViewProps {
  events: Event[];
  loading?: boolean;
  timeRange?: '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d') => void;
  onRefresh?: () => void;
  onEventClick?: (eventId: string) => void;
  /** Ouvre le panneau droit et déclenche la génération du contexte (contexte affiché à droite). */
  onFetchPageContext?: () => void;
  onOpenContextPanel?: () => void;
}

const RECENT_EVENT_MS = 6 * 60 * 60 * 1000; // 6h

interface PointWithMeta {
  event: Event;
  lat: number;
  lon: number;
  label?: string;
  category: GlobeCategory;
  importance: number;
  haloPx: number;
  sizePx: number;
  isRecent: boolean;
}

export default function DiscoverGlobeView({
  events,
  loading = false,
  timeRange = '7d',
  onTimeRangeChange,
  onRefresh,
  onEventClick,
  onFetchPageContext,
  onOpenContextPanel,
}: DiscoverGlobeViewProps) {
  const mapRef = useRef<any>(null);
  const [hoveredEvent, setHoveredEvent] = useState<PointWithMeta | null>(null);
  const [popupEvent, setPopupEvent] = useState<PointWithMeta | null>(null);
  const [highlightedSignalCoords, setHighlightedSignalCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<Set<GlobeCategory>>(() => new Set(GLOBE_CATEGORY_IDS));

  const points = useMemo(() => {
    const out: PointWithMeta[] = [];
    const seen = new Set<string>();
    const now = Date.now();
    for (const event of events) {
      const geo = eventToGeoPoint(event);
      if (!geo) continue;
      const key = `${geo.lat.toFixed(2)}_${geo.lon.toFixed(2)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const category = eventToGlobeCategory(event);
      const importance = eventImportance(event);
      const scope = eventImpactScope(event);
      const eventTime = new Date(event.date).getTime();
      const isRecent = now - eventTime < RECENT_EVENT_MS;
      out.push({
        event,
        lat: geo.lat,
        lon: geo.lon,
        label: geo.label,
        category,
        importance,
        haloPx: impactScopeToHaloPx(scope),
        sizePx: importanceToSizePx(importance),
        isRecent,
      });
    }
    return out;
  }, [events]);

  const filteredPoints = useMemo(
    () => points.filter((p) => categoryFilters.has(p.category)),
    [points, categoryFilters]
  );

  const toggleCategory = useCallback((cat: GlobeCategory) => {
    setCategoryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size <= 1) return prev;
        next.delete(cat);
      } else next.add(cat);
      return next;
    });
  }, []);

  const handleRequestContext = useCallback(() => {
    onOpenContextPanel?.();
    onFetchPageContext?.();
  }, [onOpenContextPanel, onFetchPageContext]);

  const snapshot = useMemo(() => buildGlobalSnapshot(events), [events]);
  const topSignals = useMemo(() => buildTopSignals(events, 5), [events]);
  const dynamics = useMemo(() => buildDynamics(events), [events]);

  const onMapLoad = useCallback((evt: { target: any }) => {
    const map = evt.target?.getMap?.();
    if (map && typeof map.setProjection === 'function') {
      map.setProjection({ type: 'globe' });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopupEvent(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isPointHighlighted = useCallback(
    (lat: number, lon: number) => {
      if (!highlightedSignalCoords) return false;
      const dLat = Math.abs(lat - highlightedSignalCoords.lat);
      const dLon = Math.abs(lon - highlightedSignalCoords.lon);
      return dLat < 0.5 && dLon < 0.5;
    },
    [highlightedSignalCoords]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] text-slate-500">
        <div className="text-center text-sm">
          <p className="font-medium text-gray-400">Globe</p>
          <p className="mt-1">Définir VITE_MAPBOX_ACCESS_TOKEN pour afficher le globe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-white">Actualité mondiale</h2>
          <span className="text-sm text-slate-400">
            {points.length} point{points.length !== 1 ? 's' : ''} · temps réel
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onTimeRangeChange && (
            <div className="flex rounded-lg bg-white/5 border border-white/10 p-0.5">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => onTimeRangeChange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-light transition-colors ${
                    timeRange === range
                      ? 'bg-[#E1463E]/20 text-[#E1463E]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white text-sm transition-colors disabled:opacity-50"
              aria-label="Actualiser"
            >
              <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          )}
        </div>
      </div>

      {/* Global Snapshot — bande dédiée (dans le flux, ne recouvre pas la carte) */}
      <div className="shrink-0 px-4 py-3 bg-black/70 border-b border-white/5">
        <p className="text-center text-sm text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
          {snapshot}
        </p>
        {/* Contexte IA — ouvre le panneau droit et génère le contexte */}
        {onFetchPageContext && (
          <div className="mt-3 pt-3 border-t border-white/5 max-w-2xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1] font-medium inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" aria-hidden /> Contexte IA
              </span>
              <button
                type="button"
                onClick={handleRequestContext}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-[#2A2A2A] text-slate-300 hover:bg-white/10 hover:text-white text-xs transition-colors"
                aria-label="Générer le contexte et l'afficher à droite"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden />
                Générer le contexte
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-1.5">
              Le contexte s&apos;affiche dans le panneau à droite. Fermez-le pour retrouver la carte en plein écran.
            </p>
          </div>
        )}
        {/* Filtres par catégorie (pills) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-white/5">
          {GLOBE_CATEGORY_IDS.map((id) => {
            const active = categoryFilters.has(id);
            const { shortLabel, color } = GLOBE_CATEGORIES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleCategory(id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'opacity-100 ring-1 ring-white/20'
                    : 'opacity-40 hover:opacity-70'
                }`}
                style={{ backgroundColor: active ? `${color}22` : 'transparent', color: active ? color : '#A1A1A1' }}
                aria-pressed={active}
                aria-label={`Filtrer ${shortLabel}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="discover-globe-map flex-1 min-h-0 w-full relative">
        {loading && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Chargement des événements…</span>
            </div>
          </div>
        )}
        {!loading && filteredPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
            <div className="text-center max-w-sm px-4">
              <p className="text-white font-medium">Aucun événement à afficher</p>
              <p className="text-slate-400 text-sm mt-1">
                {points.length === 0
                  ? 'Aucune donnée pour cette période.'
                  : 'Modifiez les filtres de catégorie pour voir des événements.'}
              </p>
            </div>
          </div>
        )}
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: 20,
            latitude: 25,
            zoom: 1.2,
          }}
          onLoad={onMapLoad}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          attributionControl={false}
        >
          {filteredPoints.map((p) => {
            const highlighted = isPointHighlighted(p.lat, p.lon);
            return (
              <Marker
                key={p.event.id}
                longitude={p.lon}
                latitude={p.lat}
                anchor="center"
                onClick={() => setPopupEvent(p)}
                onMouseEnter={() => setHoveredEvent(p)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div
                  className={`relative cursor-pointer transition-transform hover:scale-110 transition-shadow ${p.isRecent ? 'globe-marker-pulse' : ''}`}
                  style={{
                    width: p.haloPx * 2,
                    height: p.haloPx * 2,
                    marginLeft: -p.haloPx,
                    marginTop: -p.haloPx,
                    boxShadow: highlighted ? `0 0 0 3px white, 0 0 12px ${GLOBE_CATEGORIES[p.category].color}` : undefined,
                  }}
                  title={p.event.headline}
                >
                  <div
                    className="absolute inset-0 rounded-full opacity-35"
                    style={{ backgroundColor: GLOBE_CATEGORIES[p.category].color }}
                  />
                  <div
                    className={`absolute rounded-full border-2 border-white/90 shadow-lg ${p.isRecent ? 'globe-marker-pulse-dot' : ''}`}
                    style={{
                      width: p.sizePx,
                      height: p.sizePx,
                      left: p.haloPx - p.sizePx / 2,
                      top: p.haloPx - p.sizePx / 2,
                      backgroundColor: GLOBE_CATEGORIES[p.category].color,
                    }}
                  />
                </div>
              </Marker>
            );
          })}

          {hoveredEvent && (
            <Popup
              longitude={hoveredEvent.lon}
              latitude={hoveredEvent.lat}
              anchor="bottom"
              closeButton={false}
              onClose={() => setHoveredEvent(null)}
              className="discover-globe-popup"
            >
              <div className="text-left text-xs text-gray-200 min-w-[220px] max-w-[280px]">
                <div className="font-medium text-white line-clamp-2">{hoveredEvent.event.headline}</div>
                <div className="text-slate-400 mt-1">
                  {GLOBE_CATEGORIES[hoveredEvent.category].shortLabel}
                  {(hoveredEvent.event.region || hoveredEvent.event.country) && (
                    <> · {[hoveredEvent.event.region, hoveredEvent.event.country].filter(Boolean).join(', ')}</>
                  )}
                </div>
                <div className="text-slate-500 mt-1.5">
                  {formatDistanceToNow(new Date(hoveredEvent.event.date), { addSuffix: true, locale: fr })}
                </div>
              </div>
            </Popup>
          )}

        </Map>

        {/* Partie contexte — carte overlay compacte (économise l’espace, pas de panneau droit) */}
        {popupEvent && (
          <div
            className="absolute top-4 right-4 z-30 w-[min(340px,calc(100%-2rem))] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-xl backdrop-blur-sm"
            role="dialog"
            aria-label="Détail de l’événement"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider shrink-0"
                  style={{ color: GLOBE_CATEGORIES[popupEvent.category].color }}
                >
                  {GLOBE_CATEGORIES[popupEvent.category].shortLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setPopupEvent(null)}
                  className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-200 mt-2 line-clamp-3 leading-snug">
                {popupEvent.event.description || popupEvent.event.headline}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                <span>
                  {formatDistanceToNow(new Date(popupEvent.event.date), { addSuffix: true, locale: fr })}
                </span>
                {(popupEvent.event.region || popupEvent.event.country) && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {[popupEvent.event.region, popupEvent.event.country].filter(Boolean).join(', ')}
                    </span>
                  </>
                )}
              </div>
              <Link
                to={`/events/${popupEvent.event.id}`}
                onClick={() => onEventClick?.(popupEvent.event.id)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#E1463E] hover:text-[#E1463E]/90 font-medium"
              >
                Voir le détail
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Legend — What you're seeing (top-left on map to avoid overlapping time controls) */}
      <div className="absolute top-4 left-4 z-20 w-52 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A]/95 backdrop-blur-md p-3 text-left">
        <p className="text-[10px] uppercase tracking-wider text-[#A1A1A1] font-medium mb-2">
          What you&apos;re seeing
        </p>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {(Object.entries(GLOBE_CATEGORIES) as [GlobeCategory, typeof GLOBE_CATEGORIES[GlobeCategory]][]).map(([id, { label, color }]) => (
            <li key={id} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-[#A1A1A1] mt-2 pt-2 border-t border-[#2A2A2A]">
          Size = importance · Halo = scope (local → global)
        </p>
      </div>

      {/* Right panel: Top signals + Dynamics */}
      <div className="absolute bottom-4 right-4 top-auto z-20 w-64 flex flex-col gap-3">
        {/* Top signals */}
        {topSignals.length > 0 && (
          <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A]/95 backdrop-blur-md p-3">
            <p className="text-[10px] uppercase tracking-wider text-[#A1A1A1] font-medium mb-2">
              Top signals (last {timeRange})
            </p>
            <ul className="space-y-1.5">
              {topSignals.map((s) => (
                <li
                  key={s.id}
                  onMouseEnter={() => setHighlightedSignalCoords({ lat: s.lat, lon: s.lon })}
                  onMouseLeave={() => setHighlightedSignalCoords(null)}
                >
                  <Link
                    to={s.investigateHref}
                    className="flex items-start gap-2 text-xs text-slate-300 hover:text-white transition-colors group"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: GLOBE_CATEGORIES[s.categoryId].color }}
                      aria-hidden
                    />
                    <Search className="w-3 h-3 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="line-clamp-2">
                      <span className="text-slate-400">{s.location}</span>
                      {' – '}
                      {s.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dynamics */}
        {dynamics.length > 0 && (
          <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A]/95 backdrop-blur-md p-3">
            <p className="text-[10px] uppercase tracking-wider text-[#A1A1A1] font-medium mb-2">
              Global dynamics ({timeRange})
            </p>
            <ul className="space-y-1 text-xs text-slate-300">
              {dynamics.map((d) => (
                <li key={d.category} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: GLOBE_CATEGORIES[d.categoryId].color }}
                    aria-hidden
                  />
                  {d.trend === 'up' && <ArrowUp className="w-3 h-3 text-amber-400 shrink-0" />}
                  {d.trend === 'stable' && <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />}
                  {d.trend === 'down' && <ArrowDown className="w-3 h-3 text-slate-600 shrink-0" />}
                  <span>{d.category}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
