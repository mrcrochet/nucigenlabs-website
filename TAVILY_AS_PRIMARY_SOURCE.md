# Tavily comme Source Principale - Analyse & Recommandation

## 🎯 Problème Actuel avec NewsAPI

### Limitations de NewsAPI
- ❌ **Trop générique** : Top headlines sans filtrage intelligent
- ❌ **Nouvelles obsolètes** : Mélange d'anciennes et nouvelles actualités
- ❌ **Pas de pertinence** : Pas de scoring de pertinence pour l'intelligence géopolitique
- ❌ **Bruit élevé** : Beaucoup d'articles non pertinents pour Nucigen
- ❌ **Pas de contexte** : Pas de compréhension sémantique

---

## ✅ Pourquoi Tavily est Meilleur

### Avantages de Tavily
1. **Recherche Intelligente**
   - Filtrage par pertinence (score de 0-1)
   - Compréhension sémantique du contexte
   - Recherche par concepts, pas juste mots-clés

2. **Filtrage Temporel**
   - Peut filtrer par date récente
   - Évite les nouvelles obsolètes
   - Focus sur les événements actuels

3. **Pertinence pour Nucigen**
   - Peut chercher des événements géopolitiques spécifiques
   - Filtre par secteur, région, type d'événement
   - Moins de bruit, plus de signal

4. **Qualité des Sources**
   - Sources fiables et vérifiées
   - Moins de clickbait
   - Articles plus analytiques

5. **Flexibilité**
   - Requêtes personnalisées
   - Filtrage par domaine si nécessaire
   - Contrôle total sur ce qui est collecté

---

## 🔄 Architecture Proposée

### Option A : Tavily Remplace NewsAPI (Recommandé)

```
┌─────────────────────────────────────┐
│     TAVILY (Source Principale)     │
│  - Recherche intelligente          │
│  - Filtrage par pertinence         │
│  - Événements récents uniquement   │
└─────────────────────────────────────┘
              │
              ▼
      ┌───────────────┐
      │  Table: events│
      │ (status: pending)│
      └───────────────┘
              │
              ▼
      ┌───────────────┐
      │ Event Processor│
      │ (Phase 1 + 2B) │
      └───────────────┘
```

**Avantages** :
- ✅ Qualité supérieure
- ✅ Moins de bruit
- ✅ Événements pertinents uniquement
- ✅ Contrôle total

**Inconvénients** :
- ⚠️ Coût API (mais qualité > quantité)
- ⚠️ Nécessite des requêtes bien construites

---

### Option B : Tavily + NewsAPI (Hybride)

```
┌──────────────┐    ┌──────────────┐
│   NewsAPI    │    │    Tavily    │
│  (Volume)    │    │  (Qualité)   │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └─────────┬─────────┘
                 ▼
         ┌───────────────┐
         │  Table: events│
         └───────────────┘
```

**Avantages** :
- ✅ Volume (NewsAPI) + Qualité (Tavily)
- ✅ Redondance

**Inconvénients** :
- ⚠️ Plus complexe
- ⚠️ Toujours du bruit de NewsAPI

---

## 🚀 Implémentation Recommandée

### 1. Tavily News Collector

Créer un nouveau collector qui utilise Tavily pour chercher des événements pertinents :

```typescript
// src/server/workers/tavily-news-collector.ts

const TAVILY_QUERIES = [
  // Géopolitique
  "recent geopolitical events economic impact 2025",
  "international trade policy changes sanctions",
  "regulatory changes financial markets",
  
  // Business & Finance
  "major business developments mergers acquisitions",
  "central bank policy changes interest rates",
  "commodity market disruptions supply chain",
  
  // Technology
  "technology regulation policy changes",
  "cybersecurity incidents data breaches",
  "AI regulation policy developments",
  
  // Par secteur
  "energy sector policy changes",
  "healthcare regulation policy",
  "environmental policy climate change",
];
```

### 2. Filtrage Intelligent

```typescript
// Filtrer par :
- Date : Dernières 24-48h uniquement
- Score de pertinence : > 0.6
- Domaines fiables : Reuters, FT, Bloomberg, etc.
- Type d'événement : Géopolitique, économique, réglementaire
```

### 3. Déduplication

- Même système que NewsAPI
- Basé sur URL + source

---

## 📊 Comparaison

| Critère | NewsAPI | Tavily | RSS |
|---------|---------|--------|-----|
| **Qualité** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Pertinence** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Filtrage** | ❌ | ✅ | ⭐ |
| **Volume** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Coût** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilité** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 💡 Recommandation Finale

### **Option A : Tavily comme Source Principale**

**Pourquoi** :
1. **Qualité > Quantité** : Mieux avoir 50 événements pertinents que 200 avec du bruit
2. **Aligné avec Nucigen** : Intelligence géopolitique nécessite de la pertinence
3. **Moins de traitement** : Moins d'événements à filtrer manuellement
4. **Meilleure UX** : Feed plus utile pour les utilisateurs

**Implémentation** :
- Créer `tavily-news-collector.ts`
- Requêtes ciblées par secteur/région
- Filtrage par date récente (24-48h)
- Score de pertinence minimum (0.6+)
- Garder RSS comme backup/complément

**Firecrawl** :
- Garder pour documents officiels uniquement
- Pas pour la collecte générale

---

## 🔧 Prochaines Étapes

1. ✅ Créer `tavily-news-collector.ts`
2. ✅ Définir les requêtes Tavily pertinentes
3. ✅ Intégrer dans `data-collector.ts`
4. ✅ Tester et comparer avec NewsAPI
5. ✅ Ajuster les requêtes selon les résultats
6. ⚠️ Optionnel : Garder NewsAPI comme backup

---

**Conclusion** : Tavily est clairement supérieur pour Nucigen. La qualité et la pertinence valent le coût supplémentaire.

