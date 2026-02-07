# Phase 3 — Optional OSS integrations

Phase 3 items are implemented as **optional** features: they activate when the corresponding env vars are set.

## 3.1 Données marché avancées (OpenBB)

- **Implémenté**: Adapter OpenBB Platform (API REST).
- **Fichiers**: [openbb-adapter-service.ts](../src/server/services/openbb-adapter-service.ts), route `GET /api/openbb/fundamentals/:symbol` dans [api-server.ts](../src/server/api-server.ts).
- **Config**: Définir `OPENBB_API_URL` (ex. `http://localhost:6900` si vous lancez OpenBB Platform en local, ou l'URL d'une instance déployée).
- **Comportement**: Si configuré, la route renvoie des métriques fondamentales (market_cap, pe_ratio, dividend_yield, roe, etc.) pour le symbole demandé. Sinon, renvoie `data: null` et un message explicatif.
- **Finagg**: Non intégré (Python); possible via microservice séparé qui expose une API similaire.

## 3.2 News temps réel (newsfilter.io)

- **Implémenté**: Service Newsfilter optionnel + intégration au market digest.
- **Fichiers**: [newsfilter-service.ts](../src/server/services/newsfilter-service.ts), [market-digest-service.ts](../src/server/services/market-digest-service.ts) (enrichissement des sources), route `GET /api/news/realtime` dans [api-server.ts](../src/server/api-server.ts).
- **Config**: Définir `NEWSFILTER_API_KEY`. Optionnellement `NEWSFILTER_API_URL` (défaut: `https://api.newsfilter.io`).
- **Comportement**: Si configuré, le market digest peut inclure des articles récents Newsfilter comme sources supplémentaires; `GET /api/news/realtime?limit=15` renvoie les derniers articles. Sans clé, les appels renvoient une liste vide.

## 3.3 Inspiration UI (dashboards finance)

- **Implémenté**: Bloc « Portfolio & Watchlist » sur [Overview](../src/pages/Overview.tsx) (placeholder « Coming soon ») et léger polish du bloc Market summary (dégradé, ombre).
- **Projets de référence**: [Finance-Dashboard-Frontend](https://github.com/Bhumesh2001/Finance-Dashboard-Frontend), [financial-dashboard](https://github.com/dahyman91/financial-dashboard) — référence visuelle pour une future vue complète Portfolio / Watchlist.
