# Checklist d'Audit Manuel - Préparation Beta Test

Ce document complète le script d'audit automatique avec les vérifications manuelles nécessaires pour les tests UX et fonctionnels.

---

## 🎯 Instructions

1. **Exécutez d'abord le script automatique**: `node scripts/audit-functionality.js`
2. **Complétez cette checklist manuellement** en testant chaque point
3. **Cochez** chaque item au fur et à mesure
4. **Notez** les problèmes trouvés dans la section "Notes" à la fin

---

## 1. Pages Marketing (Publiques)

### Home (`/`)
- [ ] Page se charge correctement
- [ ] Navigation vers autres pages fonctionne
- [ ] CTA "Get Started" redirige vers `/register`
- [ ] Responsive sur mobile/tablet/desktop
- [ ] Pas d'erreurs console

### Intelligence Marketing (`/intelligence-page`)
- [ ] Contenu s'affiche correctement
- [ ] Responsive design fonctionne
- [ ] Liens internes fonctionnent
- [ ] Pas d'erreurs console

### Case Studies (`/case-studies`)
- [ ] Contenu s'affiche correctement
- [ ] Responsive design fonctionne
- [ ] Pas d'erreurs console

### Research/Papers (`/papers`)
- [ ] Contenu s'affiche correctement
- [ ] Responsive design fonctionne
- [ ] Pas d'erreurs console

### Pricing (`/pricing`)
- [ ] Plans s'affichent correctement
- [ ] Responsive design fonctionne
- [ ] Pas d'erreurs console

### Pages Légales (About, Terms, Privacy, FAQ)
- [ ] `/about` - Contenu s'affiche
- [ ] `/terms` - Contenu s'affiche
- [ ] `/privacy` - Contenu s'affiche
- [ ] `/faq` - Contenu s'affiche

---

## 2. Pages Authentification

### Login (`/login`)
- [ ] Formulaire s'affiche
- [ ] Connexion avec Clerk fonctionne
- [ ] Redirection après login vers `/overview` (ou page demandée)
- [ ] Message d'erreur si credentials invalides
- [ ] Lien "Forgot Password" fonctionne
- [ ] Lien "Register" fonctionne

### Register (`/register`)
- [ ] Formulaire s'affiche
- [ ] Inscription avec Clerk fonctionne
- [ ] Redirection après inscription vers `/onboarding`
- [ ] Message d'erreur si email déjà utilisé
- [ ] Lien "Login" fonctionne

### Forgot Password (`/forgot-password`)
- [ ] Formulaire s'affiche
- [ ] Envoi d'email fonctionne
- [ ] Message de confirmation affiché

### Reset Password (`/reset-password`)
- [ ] Formulaire s'affiche
- [ ] Reset de mot de passe fonctionne
- [ ] Redirection après reset

### Onboarding (`/onboarding`)
- [ ] Flow d'onboarding s'affiche
- [ ] Navigation entre étapes fonctionne
- [ ] Sauvegarde des préférences fonctionne
- [ ] Redirection vers `/overview` après completion

### Auth Callback (`/auth/callback`)
- [ ] Redirection après OAuth fonctionne
- [ ] Pas d'erreurs

---

## 3. Pages Application (Protégées)

### Overview (`/overview`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **KPIGrid**: 4 KPIs affichés avec données
- [ ] **NarrativeCard**: Narrative factuelle affichée
- [ ] **TimelineCard**: Timeline interactive fonctionne
- [ ] **MarketMoversCard**: Movers avec sparklines
- [ ] **TopSignalsTable**: Table signaux, navigation vers détails
- [ ] **RecentEventsFeed**: Feed événements récents
- [ ] **TriggeredAlertsFeed**: Feed alertes déclenchées
- [ ] **Navigation**: SideNav highlight actif
- [ ] **Responsive**: Mobile drawer fonctionne

### Intelligence Feed (`/intelligence`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] Feed de signaux s'affiche
- [ ] Filtres fonctionnent
- [ ] Navigation vers signal detail fonctionne
- [ ] Responsive design

### Events Feed (`/events-feed`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] Liste d'événements s'affiche
- [ ] **EventFiltersRail**: Filtres fonctionnent (type, région, secteur, etc.)
- [ ] **EventsList**: Liste paginée, recherche
- [ ] **EventCard**: Card événement, sources, timestamps
- [ ] **MarketReactionChip**: Chip avec sparkline si asset lié
- [ ] **ContextInspector**: Panneau contexte au clic
- [ ] **Responsive**: Mobile drawer pour inspector

### Event Detail (`/events-feed/:id`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **EventDetailHeader**: Header avec métadonnées
- [ ] **EventFactsPanel**: Facts only (pas d'impact/why_it_matters)
- [ ] **EvidenceSourcesPanel**: Sources avec excerpts
- [ ] **MarketPanel**: Chart prix si asset lié
- [ ] **RelatedPanel**: Événements/signaux liés
- [ ] Navigation back fonctionne

### Signals Feed (`/signals-feed`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **SignalFilters**: Filtres fonctionnent (scope, horizon, impact, etc.)
- [ ] **SignalsTable**: Table signaux, tri, pagination
- [ ] **SignalPreviewDrawer**: Preview au clic
- [ ] Navigation vers signal detail fonctionne

### Signal Detail (`/signals/:id`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **SignalHeader**: Header avec métriques
- [ ] **SignalEvidenceGraph**: Graph evidence (événements liés)
- [ ] **EventStack**: Stack d'événements
- [ ] **SignalMetricsCard**: Métriques signal
- [ ] **MarketValidationCard**: Validation marché (correlation, pas causalité)
- [ ] **NextActionsBar**: Actions suggérées

### Markets (`/markets`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **MarketHeader**: Header avec timeframe selector
- [ ] **MainMarketChart**: Chart principal, event markers
- [ ] **AssetStatsCard**: Stats asset, données Twelve Data
- [ ] **RelatedEventsCard**: Événements liés
- [ ] **AssetTable**: Table watchlist
- [ ] Navigation vers asset detail fonctionne

### Asset Detail (`/markets/:symbol`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **AssetHeader**: Header asset avec prix
- [ ] **PriceChartWithMarkers**: Chart avec markers temporels
- [ ] **KeyMetricsPanel**: Métriques clés
- [ ] **RelatedEventsList**: Liste événements liés
- [ ] **ActiveSignalsList**: Signaux actifs
- [ ] **AttributionPanel**: Attribution temporelle (pas "caused by")

### Impacts (`/impacts`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **ImpactFilters**: Filtres (probabilité, magnitude, timeframe)
- [ ] **ImpactCardGrid**: Grid cards impacts
- [ ] Navigation vers impact detail fonctionne

### Impact Detail (`/impacts/:id`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] **ScenarioNarrative**: Narrative scénario
- [ ] **AssumptionsList**: Liste assumptions
- [ ] **Pathways**: First/second order effects
- [ ] **ProbabilityPanel**: Panel probabilité
- [ ] **AssetsExposurePanel**: Exposition assets
- [ ] **ChartPack**: Charts d'exposition
- [ ] **InvalidationPanel**: Conditions invalidation

### Research (`/research`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] Page s'affiche correctement
- [ ] Navigation fonctionne

### Alerts (`/alerts`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] Liste d'alertes s'affiche
- [ ] Navigation vers events fonctionne

### Settings (`/settings`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] Paramètres utilisateur s'affichent
- [ ] Sauvegarde des préférences fonctionne

### Alert Settings (`/settings/alerts`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] Configuration alertes s'affiche
- [ ] Sauvegarde fonctionne

### Profile (`/profile`)
- [ ] **Protection**: Redirige vers `/login` si non authentifié
- [ ] Profil utilisateur s'affiche
- [ ] Édition fonctionne

---

## 4. Redirections Legacy

- [ ] `/dashboard` → `/overview` (redirection fonctionne)
- [ ] `/app` → `/overview` (redirection fonctionne)
- [ ] `/events` → `/events-feed` (redirection fonctionne)
- [ ] `/events/:id` → `/events-feed/:id` (redirection fonctionne)

---

## 5. Intégrations

### Clerk
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` configuré (vérifier console)
- [ ] Login fonctionne
- [ ] Register fonctionne
- [ ] Logout fonctionne
- [ ] Protected routes redirigent vers `/login` si non authentifié
- [ ] `ClerkWrapper` gère l'absence de clé gracieusement (affiche message)
- [ ] `ClerkErrorBoundary` catch les erreurs Clerk
- [ ] User ID récupéré correctement

### Supabase
- [ ] `VITE_SUPABASE_URL` configuré
- [ ] `VITE_SUPABASE_ANON_KEY` configuré
- [ ] Connexion Supabase fonctionne (pas d'erreurs console)
- [ ] `getNormalizedEvents()` retourne des données
- [ ] `getSignalsFromEvents()` retourne des données
- [ ] `searchEvents()` fonctionne avec filtres
- [ ] Isolation des données utilisateur fonctionne (chaque user voit ses propres données)

### Twelve Data
- [ ] `TWELVEDATA_API_KEY` configuré
- [ ] `getRealTimePrice()` fonctionne (vérifier dans Markets page)
- [ ] `getTimeSeries()` fonctionne (vérifier charts)
- [ ] Gestion d'erreurs robuste (clé manquante, invalide, rate limit)
- [ ] UI affiche des messages d'erreur clairs (`ErrorState`)
- [ ] Retry logic fonctionne

### OpenAI (Agents)
- [ ] `OPENAI_API_KEY` configuré
- [ ] `SignalAgent` génère des signaux (vérifier Intelligence Feed)
- [ ] `ImpactAgent` génère des impacts (vérifier Impacts page)
- [ ] Gestion d'erreurs API OpenAI

---

## 6. Responsive Design

### Mobile (< 640px)
- [ ] SideNav devient drawer mobile
- [ ] RightInspector devient drawer/modal mobile
- [ ] TopNav hamburger menu fonctionne
- [ ] Grilles adaptent colonnes
- [ ] Cards responsive (padding, taille texte)
- [ ] Charts responsive
- [ ] Tables scrollables horizontalement

### Tablet (640px - 1024px)
- [ ] Layout adapte colonnes
- [ ] Navigation fonctionne
- [ ] Charts lisibles

### Desktop (> 1024px)
- [ ] Layout 12 colonnes complet
- [ ] SideNav collapsible
- [ ] RightInspector visible si nécessaire

---

## 7. Gestion d'Erreurs

### Backend
- [ ] Réponses d'erreur standardisées (`success: false`, `error`, `message`)
- [ ] Codes HTTP appropriés (400, 401, 403, 429, 500, 503)
- [ ] Messages d'erreur clairs pour utilisateur

### Frontend
- [ ] `ErrorState` component utilisé partout
- [ ] Messages d'erreur utilisateur-friendly
- [ ] Retry buttons où approprié
- [ ] Loading states pendant fetch
- [ ] Empty states quand pas de données
- [ ] `ErrorBoundary` catch erreurs React
- [ ] `ClerkErrorBoundary` catch erreurs Clerk

### Scénarios d'Erreur
- [ ] API Twelve Data down → Message clair affiché
- [ ] API Supabase down → Message clair affiché
- [ ] Network offline → Message clair affiché
- [ ] Clé Clerk manquante → Message setup affiché
- [ ] Rate limit → Message retry later affiché

---

## 8. Règles Architecture

### Terminology
- [ ] Event = factual occurrence (pas d'interprétation dans Events pages)
- [ ] Signal = interpreted pattern (pas de projection dans Signals pages)
- [ ] Impact = projected future effect (pas de facts dans Impacts pages)

### Data Flow
- [ ] Event → Signal → Impact respecté
- [ ] Pas de Signals dans Events pages
- [ ] Pas d'Impacts dans Events/Signals pages
- [ ] Pas de "why it matters" dans Events pages
- [ ] Pas de prédictions dans Events pages

### Market Data Rules
- [ ] Tous les prix affichent timestamps
- [ ] Toutes les sources affichées
- [ ] AttributionPanel = "temporal proximity", pas "caused by"
- [ ] Event markers = temporal proximity, pas causalité

---

## 9. Navigation et UX

### Navigation
- [ ] SideNav items highlight actif
- [ ] Breadcrumbs fonctionnent (si présents)
- [ ] Liens internes fonctionnent
- [ ] Back button navigate correctement

### UX
- [ ] Feedback visuel sur actions (hover, click)
- [ ] Transitions smooth
- [ ] Pas de flash de contenu blanc
- [ ] Messages de succès/erreur clairs

---

## 10. Flow Complet Utilisateur

1. [ ] Arrivée sur landing page (`/`)
2. [ ] Clic "Get Started" → Register (`/register`)
3. [ ] Inscription → Onboarding (`/onboarding`)
4. [ ] Navigation vers Overview (`/overview`)
5. [ ] Consultation Events Feed (`/events-feed`)
6. [ ] Clic sur Event → Event Detail (`/events-feed/:id`)
7. [ ] Navigation vers Signals Feed (`/signals-feed`)
8. [ ] Clic sur Signal → Signal Detail (`/signals/:id`)
9. [ ] Navigation vers Markets (`/markets`)
10. [ ] Clic sur Asset → Asset Detail (`/markets/:symbol`)
11. [ ] Navigation vers Impacts (`/impacts`)
12. [ ] Clic sur Impact → Impact Detail (`/impacts/:id`)
13. [ ] Navigation vers Settings (`/settings`)
14. [ ] Logout → Retour landing page

---

## 11. Performance

- [ ] Lazy loading routes fonctionne (pas de chargement initial lourd)
- [ ] Skeleton loaders affichés pendant chargement
- [ ] Pas de re-fetch inutile
- [ ] Bundle size raisonnable (vérifier Network tab)

---

## 12. Variables d'Environnement Vercel

Vérifier que toutes les variables suivantes sont configurées sur Vercel:

- [ ] `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] `SUPABASE_URL`
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `TWELVEDATA_API_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `TAVILY_API_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (backend)

---

## 📝 Notes

Utilisez cette section pour noter les problèmes trouvés, les bugs, ou les améliorations suggérées:

```
[Date: _______________]
[Tester: _______________]

Problèmes trouvés:
1. 
2. 
3. 

Améliorations suggérées:
1. 
2. 
3. 
```

---

## ✅ Validation Finale

Une fois cette checklist complétée:

- [ ] Tous les items critiques sont cochés
- [ ] Tous les bugs majeurs sont documentés
- [ ] Rapport généré pour l'équipe
- [ ] Prêt pour les 10 premiers utilisateurs test

---

**Date de completion:** _______________
**Validé par:** _______________
