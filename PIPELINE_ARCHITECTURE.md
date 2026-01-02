# 🏗️ Architecture Pipeline de Données et Recommandations - Nucigen Labs

## 📋 Vue d'ensemble

Cette architecture décrit comment développer la pipeline pour :
1. **Collecter** les événements (géopolitiques, industriels, supply chain, etc.)
2. **Traiter** et **analyser** ces événements
3. **Générer** des recommandations personnalisées par domaine/utilisateur
4. **Distribuer** les insights aux utilisateurs

---

## 🎯 Objectifs

- **Personnalisation** : Recommandations basées sur `sector`, `professional_role`, `intended_use`, `exposure`
- **Temps réel** : Mise à jour continue des événements et prédictions
- **Scalabilité** : Architecture qui peut gérer des millions d'événements
- **Intelligence** : Analyse causale et prédictions de second ordre

---

## 🏛️ Architecture en 3 Couches

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 1: COLLECTE                        │
│  Sources → APIs → Web Scraping → RSS Feeds → Manual Input   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                 COUCHE 2: TRAITEMENT & ANALYSE               │
│  Normalisation → Enrichissement → Classification → ML/AI    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              COUCHE 3: RECOMMANDATIONS & DISTRIBUTION       │
│  Matching Utilisateur → Scoring → Filtrage → Notification  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Couche 1 : Collecte de Données

### Sources de données

#### 1. **APIs Tierces**
```typescript
// Exemples de sources
- NewsAPI (actualités générales)
- Alpha Vantage (données financières)
- FRED API (données économiques US)
- World Bank API (données macro)
- UN Comtrade (commerce international)
- IEA (énergie)
```

#### 2. **Web Scraping** (avec respect des ToS)
```typescript
// Sources ciblées
- Reuters, Bloomberg, Financial Times
- Sites gouvernementaux (sanctions, régulations)
- Organisations internationales (WTO, IMF, etc.)
```

#### 3. **RSS Feeds & Webhooks**
```typescript
// Flux structurés
- RSS feeds de sources fiables
- Webhooks depuis services partenaires
- APIs de médias spécialisés
```

### Structure de données collectées

```sql
-- Table: events (événements bruts)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'newsapi', 'scraper', 'manual', etc.
  source_id TEXT, -- ID dans la source originale
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Contenu complet
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Métadonnées
  url TEXT,
  author TEXT,
  language TEXT DEFAULT 'en',
  
  -- Classification initiale (peut être améliorée par ML)
  raw_category TEXT, -- Catégorie de la source
  raw_tags TEXT[], -- Tags de la source
  
  -- Statut de traitement
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'processed', 'error'
  processing_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_events_published_at ON events(published_at DESC);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_source ON events(source);
```

---

## 🔄 Couche 2 : Traitement & Analyse

### Pipeline de traitement

#### Étape 1 : Normalisation
```typescript
// src/server/processors/normalizer.ts
interface RawEvent {
  source: string;
  data: any;
}

interface NormalizedEvent {
  title: string;
  description: string;
  published_at: Date;
  source: string;
  source_id: string;
  url?: string;
}

function normalizeEvent(raw: RawEvent): NormalizedEvent {
  // Normaliser selon la source
  // - Formater les dates
  // - Nettoyer le texte
  // - Extraire les métadonnées
}
```

#### Étape 2 : Enrichissement
```typescript
// src/server/processors/enricher.ts
interface EnrichedEvent extends NormalizedEvent {
  // Entités nommées
  entities: {
    organizations: string[];
    locations: string[];
    people: string[];
    products: string[];
  };
  
  // Classification
  level: 'Geopolitical' | 'Industrial' | 'Supply Chain' | 'Market' | 'Regulatory';
  sectors: string[]; // ['Technology', 'Energy', 'Finance', etc.]
  regions: string[]; // ['US', 'EU', 'China', etc.]
  
  // Sentiment
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number; // -1 to 1
}
```

#### Étape 3 : Analyse causale
```typescript
// src/server/analyzers/causal-analyzer.ts
interface CausalChain {
  event_id: UUID;
  direct_impacts: Impact[];
  second_order_impacts: Impact[];
  third_order_impacts: Impact[];
}

interface Impact {
  type: 'market' | 'supply_chain' | 'regulatory' | 'geopolitical';
  sector: string;
  region: string;
  asset_class?: string; // 'equity', 'commodity', 'currency', etc.
  timeframe: string; // 'immediate', '1-7d', '1-4w', '1-3m', '6m+'
  confidence: number; // 0-1
  description: string;
}
```

#### Étape 4 : Prédictions
```typescript
// src/server/analyzers/predictor.ts
interface Prediction {
  event_id: UUID;
  asset: string; // 'Crude Oil', 'Semiconductor ETF', etc.
  direction: 'up' | 'down' | 'neutral';
  magnitude: number; // Pourcentage estimé
  confidence: number; // 0-1
  timeframe: string; // '12-24h', '24-48h', etc.
  reasoning: string; // Explication causale
}
```

### Tables Supabase pour le traitement

```sql
-- Table: processed_events (événements traités)
CREATE TABLE processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Classification
  level TEXT NOT NULL CHECK (level IN ('Geopolitical', 'Industrial', 'Supply Chain', 'Market', 'Regulatory')),
  sectors TEXT[] NOT NULL,
  regions TEXT[] NOT NULL,
  
  -- Entités
  entities JSONB, -- {organizations: [], locations: [], people: []}
  
  -- Sentiment
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC, -- -1 to 1
  
  -- Métadonnées de traitement
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_version TEXT, -- Version du modèle utilisé
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: causal_chains (chaînes causales)
CREATE TABLE causal_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES processed_events(id) ON DELETE CASCADE,
  
  -- Impacts directs
  direct_impacts JSONB NOT NULL, -- Array of Impact objects
  
  -- Impacts de second ordre
  second_order_impacts JSONB,
  
  -- Impacts de troisième ordre
  third_order_impacts JSONB,
  
  -- Métadonnées
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: predictions (prédictions de marché)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES processed_events(id) ON DELETE CASCADE,
  causal_chain_id UUID REFERENCES causal_chains(id),
  
  asset TEXT NOT NULL, -- 'Crude Oil (WTI)', 'Semiconductor ETF', etc.
  asset_type TEXT, -- 'commodity', 'equity', 'currency', 'index'
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down', 'neutral')),
  magnitude NUMERIC, -- Pourcentage estimé
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  timeframe TEXT NOT NULL, -- '12-24h', '24-48h', '48-72h', etc.
  reasoning TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'active', -- 'active', 'fulfilled', 'expired', 'invalidated'
  actual_outcome TEXT, -- Rempli après vérification
  accuracy_score NUMERIC, -- Calculé après vérification
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);
```

---

## 🎯 Couche 3 : Recommandations & Distribution

### Système de matching utilisateur

#### Profil utilisateur (déjà dans `users` table)
```typescript
interface UserProfile {
  id: string;
  sector: string; // 'Technology', 'Energy', 'Finance', etc.
  professional_role: string; // 'analyst', 'trader', 'portfolio_manager', etc.
  intended_use: string; // Usage déclaré
  exposure: string; // 'retail', 'institutional', 'enterprise', etc.
  company?: string;
}
```

#### Algorithme de scoring

```typescript
// src/server/recommendations/scorer.ts
interface RecommendationScore {
  event_id: UUID;
  user_id: UUID;
  score: number; // 0-100
  reasons: string[];
}

function calculateRelevanceScore(
  event: ProcessedEvent,
  user: UserProfile
): RecommendationScore {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. Match par secteur (40 points max)
  if (event.sectors.includes(user.sector)) {
    score += 40;
    reasons.push(`Relevant to your sector: ${user.sector}`);
  }
  
  // 2. Match par rôle professionnel (30 points max)
  const roleWeights = {
    'analyst': ['Geopolitical', 'Industrial', 'Regulatory'],
    'trader': ['Market', 'Supply Chain'],
    'portfolio_manager': ['Market', 'Geopolitical', 'Industrial'],
    'researcher': ['Geopolitical', 'Regulatory', 'Industrial'],
  };
  
  if (roleWeights[user.professional_role]?.includes(event.level)) {
    score += 30;
    reasons.push(`Matches your role: ${user.professional_role}`);
  }
  
  // 3. Match par intended_use (20 points max)
  // Analyse du texte pour trouver des mots-clés pertinents
  if (matchesIntendedUse(event, user.intended_use)) {
    score += 20;
    reasons.push(`Aligned with your use case`);
  }
  
  // 4. Match par exposure (10 points max)
  // Les événements critiques sont plus importants pour les institutions
  if (user.exposure === 'institutional' && event.level === 'Critical') {
    score += 10;
    reasons.push(`Critical event for institutional exposure`);
  }
  
  return { event_id: event.id, user_id: user.id, score, reasons };
}
```

### Table de recommandations

```sql
-- Table: user_recommendations (recommandations personnalisées)
CREATE TABLE user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES processed_events(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES predictions(id),
  
  -- Scoring
  relevance_score NUMERIC NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  reasons TEXT[] NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'new', -- 'new', 'viewed', 'dismissed', 'saved'
  viewed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Priorité
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX idx_user_recommendations_score ON user_recommendations(relevance_score DESC);
CREATE INDEX idx_user_recommendations_status ON user_recommendations(status);
CREATE INDEX idx_user_recommendations_priority ON user_recommendations(priority);
```

### Fonction Supabase pour générer les recommandations

```sql
-- Fonction pour générer les recommandations pour un utilisateur
CREATE OR REPLACE FUNCTION generate_user_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  recommendation_id UUID,
  event_id UUID,
  title TEXT,
  level TEXT,
  relevance_score NUMERIC,
  reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH user_profile AS (
    SELECT sector, professional_role, intended_use, exposure
    FROM users
    WHERE id = p_user_id
  ),
  scored_events AS (
    SELECT 
      pe.id as event_id,
      pe.level,
      e.title,
      -- Calcul du score de pertinence (simplifié)
      CASE 
        WHEN pe.sectors @> ARRAY[up.sector] THEN 40
        ELSE 0
      END +
      CASE 
        WHEN up.professional_role = 'analyst' AND pe.level IN ('Geopolitical', 'Industrial', 'Regulatory') THEN 30
        WHEN up.professional_role = 'trader' AND pe.level IN ('Market', 'Supply Chain') THEN 30
        WHEN up.professional_role = 'portfolio_manager' AND pe.level IN ('Market', 'Geopolitical', 'Industrial') THEN 30
        ELSE 0
      END +
      CASE 
        WHEN up.exposure = 'institutional' AND pe.level = 'Critical' THEN 10
        ELSE 0
      END as relevance_score,
      ARRAY[
        CASE WHEN pe.sectors @> ARRAY[up.sector] THEN 'Relevant to your sector' END,
        CASE WHEN up.professional_role = 'analyst' AND pe.level IN ('Geopolitical', 'Industrial', 'Regulatory') 
          THEN 'Matches your analytical role' END
      ]::TEXT[] as reasons
    FROM processed_events pe
    CROSS JOIN user_profile up
    JOIN events e ON e.id = pe.event_id
    WHERE pe.processed_at > NOW() - INTERVAL '7 days' -- Derniers 7 jours
    AND NOT EXISTS (
      SELECT 1 FROM user_recommendations ur
      WHERE ur.user_id = p_user_id AND ur.event_id = pe.id
    )
  )
  SELECT 
    gen_random_uuid() as recommendation_id,
    se.event_id,
    se.title,
    se.level,
    se.relevance_score,
    se.reasons
  FROM scored_events se
  WHERE se.relevance_score > 30 -- Seuil minimum
  ORDER BY se.relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔧 Technologies Recommandées

### Backend (Pipeline)

#### Option 1 : **Node.js + TypeScript** (recommandé pour commencer)
```typescript
// Avantages
- Même langage que le frontend
- Écosystème riche (libraries NLP, APIs)
- Facile à déployer (Vercel, Railway, etc.)
- Intégration facile avec Supabase
```

#### Option 2 : **Python** (pour ML/AI avancé)
```python
# Avantages
- Meilleur écosystème ML (spaCy, transformers, etc.)
- Bibliothèques NLP puissantes
- Facile à intégrer avec Supabase (via REST API)
```

### Services

1. **Supabase** : Base de données + Auth + Realtime
2. **Vercel/Netlify** : Déploiement frontend
3. **Railway/Render** : Déploiement workers/background jobs
4. **OpenAI API** : Pour l'analyse de texte et génération de prédictions
5. **Anthropic Claude** : Alternative pour l'analyse

---

## 🚀 Plan d'Implémentation (MVP)

### Phase 1 : Infrastructure de base (Semaine 1-2)
- [ ] Créer les tables Supabase (`events`, `processed_events`, `predictions`)
- [ ] Créer un worker Node.js pour la collecte de données
- [ ] Intégrer NewsAPI pour commencer
- [ ] Pipeline de normalisation basique

### Phase 2 : Traitement basique (Semaine 3-4)
- [ ] Enrichissement avec entités nommées (spaCy ou OpenAI)
- [ ] Classification par niveau (Geopolitical, Industrial, etc.)
- [ ] Extraction de secteurs et régions
- [ ] Stockage dans `processed_events`

### Phase 3 : Recommandations (Semaine 5-6)
- [ ] Fonction Supabase `generate_user_recommendations`
- [ ] Algorithme de scoring basique
- [ ] API endpoint pour récupérer les recommandations
- [ ] Affichage dans le dashboard

### Phase 4 : Prédictions (Semaine 7-8)
- [ ] Analyse causale basique (règles + LLM)
- [ ] Génération de prédictions
- [ ] Stockage dans `predictions`
- [ ] Affichage dans le dashboard

### Phase 5 : Amélioration continue
- [ ] ML pour améliorer le scoring
- [ ] Feedback utilisateur pour améliorer les recommandations
- [ ] A/B testing des algorithmes
- [ ] Métriques et analytics

---

## 📝 Exemple de Code - Worker de Collecte

```typescript
// src/server/workers/data-collector.ts
import { createClient } from '@supabase/supabase-js';
import NewsAPI from 'newsapi';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const newsapi = new NewsAPI(process.env.NEWS_API_KEY!);

async function collectNewsEvents() {
  try {
    // Récupérer les dernières actualités
    const response = await newsapi.v2.topHeadlines({
      category: 'business',
      language: 'en',
      pageSize: 100,
    });

    for (const article of response.articles) {
      // Vérifier si l'événement existe déjà
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', 'newsapi')
        .eq('source_id', article.url)
        .maybeSingle();

      if (!existing) {
        // Insérer le nouvel événement
        await supabase.from('events').insert({
          source: 'newsapi',
          source_id: article.url,
          title: article.title,
          description: article.description,
          content: article.content,
          published_at: article.publishedAt,
          url: article.url,
          author: article.author,
          status: 'pending',
        });
      }
    }
  } catch (error) {
    console.error('Error collecting news:', error);
  }
}

// Exécuter toutes les heures
setInterval(collectNewsEvents, 60 * 60 * 1000);
collectNewsEvents(); // Exécuter immédiatement
```

---

## 🎯 Prochaines Étapes

1. **Créer les tables Supabase** pour les événements et recommandations
2. **Développer un worker de collecte** simple (NewsAPI pour commencer)
3. **Créer une API endpoint** pour récupérer les recommandations utilisateur
4. **Intégrer dans le dashboard** pour afficher les recommandations personnalisées

Souhaitez-vous que je commence par créer les tables Supabase et un worker de collecte basique ?

