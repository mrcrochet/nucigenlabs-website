# Profil Utilisateur et Onboarding - Documentation

## 📋 Vue d'ensemble

Le système de création de profil et d'onboarding est **essentiel** pour le fonctionnement du scraping personnalisé. Chaque utilisateur doit compléter son profil pour que le système puisse lui fournir du contenu personnalisé en temps réel.

## 🔄 Processus de Création de Profil

### 1. Création Initiale (Lors de l'inscription)

Quand un utilisateur s'inscrit avec Clerk :

1. **Fonction `get_or_create_supabase_user_id()`** :
   - Crée un mapping entre l'ID Clerk et un UUID Supabase
   - Crée un profil minimal dans `public.users` avec :
     - `id` : UUID généré
     - `email` : Email de l'utilisateur
     - `name` : Email (par défaut)
     - `role` : 'user' (par défaut)
   - **Les champs d'onboarding sont vides** à ce stade :
     - `company` : NULL
     - `sector` : NULL
     - `professional_role` : NULL
     - `intended_use` : NULL
     - `exposure` : NULL

2. **Préférences utilisateur** :
   - Une entrée dans `user_preferences` est créée automatiquement par le trigger `trigger_create_default_preferences`
   - Mais avec des valeurs vides par défaut :
     - `preferred_sectors` : []
     - `preferred_regions` : []
     - `preferred_event_types` : []
     - `focus_areas` : []

### 2. Onboarding (Questionnaire)

L'utilisateur doit compléter le questionnaire d'onboarding (`/onboarding`) qui collecte :

**Étape 1 - Informations de base :**
- `company` : Organisation ou institution
- `professional_role` : Rôle analytique (analyst, trader, portfolio_manager, etc.)
- `intended_use` : Type de décisions/analyses que l'utilisateur veut que Nucigen supporte
- `exposure` : Échelle d'exposition au marché (optionnel)

**Étape 2 - Intérêts :**
- `preferred_sectors` : Secteurs économiques suivis (Technology, Energy, Finance, etc.)
- `preferred_regions` : Régions géographiques surveillées (US, EU, China, etc.)
- `preferred_event_types` : Types d'événements (Geopolitical, Industrial, SupplyChain, etc.)
- `focus_areas` : Zones de focus personnalisées (ex: "semiconductor supply chains")

**Étape 3 - Préférences du feed :**
- `feed_priority` : Comment prioriser les événements (relevance, recency, impact, balanced)
- `min_impact_score` : Score d'impact minimum (0.0 - 1.0)
- `min_confidence_score` : Score de confiance minimum (0.0 - 1.0)
- `preferred_time_horizons` : Horizons temporels (hours, days, weeks)

### 3. Sauvegarde des Données

Lors de la soumission du formulaire d'onboarding :

1. **Mise à jour du profil** (`updateUserProfile`) :
   ```typescript
   await updateUserProfile({
     company: formData.company,
     professional_role: formData.role,
     sector: preferences.preferred_sectors[0] || formData.sector,
     intended_use: formData.intended_use,
     exposure: formData.exposure,
   }, user.id);
   ```

2. **Mise à jour des préférences** (`updateUserPreferences`) :
   ```typescript
   await updateUserPreferences({
     preferred_sectors: preferences.preferred_sectors,
     preferred_regions: preferences.preferred_regions,
     preferred_event_types: preferences.preferred_event_types,
     focus_areas: preferences.focus_areas,
     feed_priority: preferences.feed_priority,
     min_impact_score: preferences.min_impact_score,
     min_confidence_score: preferences.min_confidence_score,
     preferred_time_horizons: preferences.preferred_time_horizons,
   }, user.id);
   ```

## 🎯 Importance pour le Scraping Personnalisé

### Utilisation des Préférences

Les préférences utilisateur sont **essentielles** pour le scraping personnalisé (`tavily-personalized-collector.ts`) :

1. **Génération de requêtes Tavily personnalisées** :
   - Basées sur `preferred_sectors` + `preferred_regions`
   - Basées sur `preferred_event_types` + `preferred_sectors`
   - Basées sur `focus_areas` (priorité maximale)
   - Basées sur `preferred_regions` pour les événements géopolitiques
   - Basées sur `preferred_sectors` pour les changements réglementaires

2. **Exemple de requêtes générées** :
   ```
   "Technology US recent developments policy changes 2025"
   "Geopolitical events Energy industry impact 2025"
   "semiconductor supply chains recent news developments 2025"
   "EU geopolitical economic policy changes 2025"
   "Energy regulatory changes policy updates 2025"
   ```

3. **Filtrage des résultats** :
   - Score de pertinence >= 0.5
   - Date : 7 derniers jours
   - Respect des `min_impact_score` et `min_confidence_score`

### Sans Onboarding Complet

Si un utilisateur n'a pas complété l'onboarding :
- ❌ Les préférences sont vides
- ❌ Le scraping personnalisé utilise des requêtes génériques
- ❌ Le contenu n'est pas adapté aux intérêts de l'utilisateur
- ❌ Les recommandations sont moins pertinentes

## 🔧 Gestion des Conflits d'Email

### Problème

L'erreur `duplicate key value violates unique constraint "users_email_key"` peut se produire si :
- Un utilisateur avec cet email existe déjà dans `users`
- La fonction `get_or_create_supabase_user_id` essaie de créer un nouvel utilisateur

### Solution

La fonction `get_or_create_supabase_user_id` a été corrigée pour :
1. Vérifier si un utilisateur avec cet email existe déjà
2. Si oui, utiliser l'ID existant au lieu d'en créer un nouveau
3. Créer le mapping Clerk → Supabase UUID pour l'utilisateur existant

```sql
-- Vérification avant création
IF user_email IS NOT NULL AND user_email != '' THEN
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = user_email
  LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Utiliser l'ID existant
    supabase_uuid := existing_user_id;
    -- Créer le mapping
    INSERT INTO public.clerk_user_mapping ...
    RETURN supabase_uuid;
  END IF;
END IF;
```

## ✅ Checklist de Vérification

Pour s'assurer qu'un utilisateur peut bénéficier du scraping personnalisé :

- [ ] Profil créé dans `public.users` (automatique lors de l'inscription)
- [ ] Préférences créées dans `user_preferences` (automatique via trigger)
- [ ] Onboarding complété (`/onboarding`)
- [ ] `preferred_sectors` non vide
- [ ] `preferred_regions` non vide (recommandé)
- [ ] `preferred_event_types` non vide (recommandé)
- [ ] `focus_areas` rempli (optionnel mais recommandé)

## 📊 Tables Concernées

### `public.users`
- Stocke les informations de profil de base
- Champs d'onboarding : `company`, `sector`, `professional_role`, `intended_use`, `exposure`

### `public.user_preferences`
- Stocke les préférences pour le scraping personnalisé
- Champs clés : `preferred_sectors`, `preferred_regions`, `preferred_event_types`, `focus_areas`

### `public.clerk_user_mapping`
- Mappe les IDs Clerk vers les UUIDs Supabase
- Permet la compatibilité entre Clerk Auth et Supabase

## 🚀 Prochaines Étapes

1. **Vérifier que tous les utilisateurs existants ont complété l'onboarding**
2. **S'assurer que le scraping personnalisé vérifie les préférences avant de collecter**
3. **Ajouter des notifications pour encourager l'onboarding**
4. **Créer un dashboard admin pour voir les utilisateurs sans préférences**


