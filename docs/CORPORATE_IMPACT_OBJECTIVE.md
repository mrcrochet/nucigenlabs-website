# 🎯 Objectif de la Page Corporate Impact

## 📋 Vue d'ensemble

La page **Corporate Impact** est conçue pour afficher des signaux de marché identifiant des compagnies susceptibles d'être impactées par des événements géopolitiques, réglementaires ou macro-économiques.

## 🎯 Objectifs principaux

1. **Afficher des opportunités** : Compagnies "underground" à haut potentiel dont les stocks vont probablement **augmenter** à cause d'événements géopolitiques/réglementaires
2. **Afficher des risques** : Entreprises qui vont probablement **perdre en valuation** à cause de ces événements
3. **Utiliser Perplexity** : Pour identifier automatiquement les compagnies impactées
4. **Pas de recherche** : Les utilisateurs ne peuvent pas rechercher, mais peuvent **filtrer** parmi les signaux fournis
5. **Système live** : Pas de démo, uniquement des signaux réels générés par le système

## 🔍 Fonctionnalités

### Filtres disponibles
- **Type** : Tous / Opportunités / Risques
- **Secteur** : Filtre par secteur d'activité (dynamique)
- **Catégorie** : Géopolitique / Finance / Énergie / Supply Chain
- **Recherche** : Par nom de compagnie

### Affichage des signaux
Chaque signal affiche :
- **Type** : Opportunity ou Risk
- **Compagnie** : Nom, ticker, secteur, market cap, prix actuel
- **Impact observé** : Magnitude, timeframe, confidence (basé sur l'historique, pas des prédictions)
- **Événement catalyseur** : L'événement qui déclenche l'impact
- **Raisonnement** : Résumé, facteurs clés, risques
- **Données de marché** : Volume, intérêt institutionnel, etc.
- **Sources** : Liens vers les sources d'information
- **Trade Impact** (si disponible) : Analyse Comtrade validant l'impact commercial

### Badges spéciaux
- **"Replay-validated"** : Signal validé par l'analyse historique
- **"Trade-Validated"** : Signal validé par les données Comtrade
- **"UNDERGROUND"** : Compagnies à petite capitalisation (< $10B)

## 🏗️ Architecture technique

### Backend
- **Worker** : `corporate-impact-worker.ts` génère les signaux
- **API** : `/api/corporate-impact/signals` pour récupérer les signaux
- **Base de données** : Table `market_signals` dans Supabase
- **Intégrations** :
  - Perplexity : Identification des compagnies
  - OpenAI : Génération des prédictions et raisonnements
  - Comtrade : Validation des impacts commerciaux
  - Firecrawl : Extraction de contenu web

### Frontend
- **Page** : `src/pages/CorporateImpactPage.tsx`
- **Composants** :
  - `CorporateImpactHeader` : En-tête avec statistiques
  - `CorporateImpactFilters` : Filtres de recherche
  - `SignalCard` : Carte d'affichage d'un signal
  - `EmptyState` : État vide avec explications

## 🔄 Flux de données

1. **Collecte d'événements** : Le pipeline collecte des événements géopolitiques/réglementaires
2. **Identification des compagnies** : Perplexity identifie les compagnies impactées
3. **Génération de signaux** : OpenAI génère les prédictions et raisonnements
4. **Validation Comtrade** : Si applicable, validation par données commerciales
5. **Stockage** : Signaux stockés dans `market_signals`
6. **Affichage** : La page frontend récupère et affiche les signaux

## ⚠️ Problèmes identifiés

1. ✅ **Bug corrigé** : Variable `error` non déclarée dans `CorporateImpactPage.tsx`
2. ⚠️ **Serveur API** : Le serveur API doit être démarré (`npm run api:server`)
3. ⚠️ **Signaux manquants** : Vérifier s'il y a des signaux actifs dans la base de données
4. ⚠️ **Worker** : Le worker doit être exécuté pour générer des signaux (`npm run trigger:corporate-impact`)

## 🚀 Prochaines étapes

1. Démarrer le serveur API
2. Vérifier les signaux dans la base de données
3. Tester l'endpoint API
4. Tester la page dans le navigateur
5. Générer des signaux si nécessaire
