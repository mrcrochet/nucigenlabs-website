# Checklist de Tests - Nucigen Labs

## 📋 Vue d'Ensemble

Cette checklist couvre tous les aspects critiques du système pour s'assurer que tout fonctionne correctement avant la mise en production.

---

## 🔐 1. Authentification & Onboarding

### 1.1 Création de Compte
- [ ] Créer un compte avec email/password
- [ ] Vérifier redirection vers `/register/confirm-email` si email confirmation activée
- [ ] Vérifier redirection vers `/onboarding` après confirmation
- [ ] Créer un compte avec Google OAuth
- [ ] Créer un compte avec LinkedIn OAuth
- [ ] Vérifier que l'utilisateur est créé dans la table `users`
- [ ] Vérifier que les préférences par défaut sont créées dans `user_preferences`

### 1.2 Onboarding
- [ ] Compléter Step 1 (Basic Info)
- [ ] Compléter Step 2 (Interests)
- [ ] Compléter Step 3 (Feed Preferences)
- [ ] Vérifier que les données sont sauvegardées dans `user_preferences`
- [ ] Vérifier redirection vers `/intelligence` après onboarding
- [ ] Tester avec MultiSelect (sectors, regions, event types)
- [ ] Tester tag input pour focus_areas

### 1.3 Connexion
- [ ] Se connecter avec email/password
- [ ] Se connecter avec Google OAuth
- [ ] Se connecter avec LinkedIn OAuth
- [ ] Vérifier redirection vers `/onboarding` si non complété
- [ ] Vérifier redirection vers `/intelligence` si onboarding complété
- [ ] Tester "Remember me" (si implémenté)

### 1.4 Déconnexion
- [ ] Se déconnecter
- [ ] Vérifier redirection vers `/`
- [ ] Vérifier que la session est supprimée

---

## 📊 2. Pipeline de Données

### 2.1 Collecte
- [ ] Exécuter `npm run pipeline:collect`
- [ ] Vérifier que des articles sont collectés depuis Tavily
- [ ] Vérifier que des articles sont collectés depuis RSS
- [ ] Vérifier que les articles sont insérés dans `events` avec `status: 'pending'`
- [ ] Vérifier la déduplication (même article ne doit pas être inséré deux fois)
- [ ] Vérifier les logs pour erreurs

### 2.2 Traitement (Phase 1)
- [ ] Exécuter `npm run pipeline:process`
- [ ] Vérifier que les événements `pending` sont traités
- [ ] Vérifier que les événements structurés sont créés dans `nucigen_events`
- [ ] Vérifier que `search_vector` est rempli automatiquement
- [ ] Vérifier que les événements traités ont `status: 'processed'`
- [ ] Vérifier les champs requis (summary, why_it_matters, impact_score, confidence)
- [ ] Vérifier que les scores sont dans les bonnes plages (0-1)

### 2.3 Chaînes Causales (Phase 2B)
- [ ] Vérifier que les chaînes causales sont créées dans `nucigen_causal_chains`
- [ ] Vérifier les champs requis (cause, first_order_effect, time_horizon)
- [ ] Vérifier que `time_horizon` est dans ['hours', 'days', 'weeks']
- [ ] Vérifier que `confidence` est dans [0, 1]
- [ ] Vérifier qu'il n'y a pas de prédictions de prix ou chiffres financiers

### 2.4 Enrichissement (Phase 4)
- [ ] Exécuter `npm run enrich:context`
- [ ] Vérifier que le contexte historique est ajouté dans `event_context`
- [ ] Exécuter `npm run enrich:official`
- [ ] Vérifier que les documents officiels sont ajoutés dans `official_documents`
- [ ] Vérifier que seuls les domaines whitelistés sont scrapés

### 2.5 Pipeline Complet
- [ ] Exécuter `npm run pipeline:run-once`
- [ ] Vérifier que toutes les étapes s'exécutent dans l'ordre
- [ ] Vérifier les logs pour erreurs
- [ ] Vérifier que le pipeline s'arrête correctement

---

## 🔔 3. Système d'Alertes

### 3.1 Préférences d'Alertes
- [ ] Aller sur `/settings/alerts`
- [ ] Activer les alertes (`notify_on_new_event: true`)
- [ ] Configurer les seuils (min_impact_score, min_confidence_score)
- [ ] Sélectionner des secteurs préférés
- [ ] Sélectionner des régions préférées
- [ ] Sélectionner des types d'événements préférés
- [ ] Configurer la fréquence de notification
- [ ] Vérifier que les préférences sont sauvegardées dans `alert_preferences`

### 3.2 Génération d'Alertes
- [ ] Exécuter `npm run alerts:generate`
- [ ] Vérifier que les alertes sont créées dans `user_alerts`
- [ ] Vérifier que seuls les événements correspondant aux préférences génèrent des alertes
- [ ] Vérifier que les alertes ont les bonnes priorités
- [ ] Vérifier les logs pour debug

### 3.3 Affichage des Alertes
- [ ] Aller sur `/alerts`
- [ ] Vérifier que les alertes non lues sont affichées
- [ ] Vérifier que les alertes lues sont dans l'onglet "All"
- [ ] Marquer une alerte comme lue
- [ ] Vérifier que l'alerte passe dans "All"
- [ ] Dismiss une alerte
- [ ] Vérifier que l'alerte disparaît

---

## 🔍 4. Recherche Full-Text

### 4.1 Page Events
- [ ] Aller sur `/events`
- [ ] Taper une recherche (ex: "sanctions")
- [ ] Vérifier que les résultats sont pertinents
- [ ] Vérifier que la recherche est rapide (< 500ms)
- [ ] Tester avec plusieurs mots (ex: "trade sanctions")
- [ ] Tester avec filtres (sectors, regions, event types)
- [ ] Tester la pagination
- [ ] Vérifier que le total de résultats est correct

### 4.2 Intelligence Feed
- [ ] Aller sur `/intelligence`
- [ ] Taper une recherche
- [ ] Vérifier que les résultats sont pertinents
- [ ] Tester le debounce (attendre 500ms après avoir tapé)
- [ ] Tester les tabs (Top, Recent, Critical)
- [ ] Vérifier que les badges "For you" et "Relevant to you" s'affichent
- [ ] Vérifier que les événements personnalisés sont prioritaires

### 4.3 Validation SQL
- [ ] Exécuter `verify_fulltext_search.sql`
- [ ] Vérifier que `search_vector` est rempli pour tous les événements
- [ ] Tester la fonction `search_nucigen_events()` directement dans SQL
- [ ] Vérifier que les résultats sont triés par relevance_score

---

## 🎨 5. Interface Utilisateur

### 5.1 Navigation
- [ ] Vérifier que la sidebar s'affiche sur toutes les pages app
- [ ] Tester tous les liens de navigation
- [ ] Vérifier que les pages protégées redirigent vers `/login` si non authentifié
- [ ] Vérifier que les pages marketing sont accessibles sans auth

### 5.2 Dashboard
- [ ] Aller sur `/dashboard`
- [ ] Vérifier que les métriques s'affichent
- [ ] Vérifier que les événements récents s'affichent
- [ ] Vérifier que les liens fonctionnent

### 5.3 Event Detail
- [ ] Cliquer sur un événement depuis `/events` ou `/intelligence`
- [ ] Vérifier que la page `/events/[event_id]` s'affiche
- [ ] Vérifier que tous les champs sont affichés (summary, why_it_matters, causal chain)
- [ ] Vérifier que "Historical Context" s'affiche si disponible
- [ ] Vérifier que "Official Documents" s'affichent si disponibles
- [ ] Vérifier que les liens vers les sources fonctionnent

### 5.4 Settings
- [ ] Aller sur `/settings`
- [ ] Vérifier que les préférences actuelles sont chargées
- [ ] Modifier les préférences
- [ ] Vérifier que les changements sont sauvegardés
- [ ] Vérifier que le message "Saved" s'affiche
- [ ] Vérifier que les changements sont reflétés dans le feed

### 5.5 Responsive
- [ ] Tester sur mobile (< 768px)
- [ ] Tester sur tablette (768px - 1024px)
- [ ] Tester sur desktop (> 1024px)
- [ ] Vérifier que la sidebar est responsive
- [ ] Vérifier que les formulaires sont utilisables sur mobile

---

## 📈 6. Qualité & Monitoring

### 6.1 Quality Dashboard
- [ ] Aller sur `/quality`
- [ ] Vérifier que les métriques s'affichent
- [ ] Vérifier que les graphiques sont lisibles
- [ ] Tester les filtres de date
- [ ] Vérifier que les scores de qualité sont cohérents

### 6.2 Validation Manuelle
- [ ] Ouvrir 5 événements aléatoires
- [ ] Vérifier que les summaries sont cohérents
- [ ] Vérifier que les causal chains sont logiques
- [ ] Vérifier que les scores (impact, confidence) sont raisonnables
- [ ] Soumettre des validations via le dashboard (si implémenté)

---

## 🔒 7. Sécurité

### 7.1 Row Level Security (RLS)
- [ ] Vérifier que les utilisateurs ne peuvent voir que leurs propres données
- [ ] Vérifier que les utilisateurs ne peuvent pas modifier les données d'autres utilisateurs
- [ ] Vérifier que les événements sont accessibles à tous les utilisateurs authentifiés
- [ ] Tester avec un utilisateur non authentifié (doit être bloqué)

### 7.2 Validation des Données
- [ ] Vérifier que les champs requis sont validés côté client
- [ ] Vérifier que les types de données sont corrects
- [ ] Vérifier que les scores sont dans les bonnes plages
- [ ] Vérifier que les arrays sont bien formatés

---

## ⚡ 8. Performance

### 8.1 Temps de Chargement
- [ ] Vérifier que `/intelligence` charge en < 2s
- [ ] Vérifier que `/events` charge en < 2s
- [ ] Vérifier que `/events/[event_id]` charge en < 1s
- [ ] Vérifier que la recherche répond en < 500ms

### 8.2 Optimisations
- [ ] Vérifier que les images sont lazy-loaded
- [ ] Vérifier que les routes sont prefetchées
- [ ] Vérifier que le code est split (chunks séparés)
- [ ] Vérifier que les requêtes sont optimisées (pas de N+1)

---

## 🐛 9. Gestion d'Erreurs

### 9.1 Erreurs API
- [ ] Tester avec une clé API invalide
- [ ] Vérifier que les erreurs sont affichées à l'utilisateur
- [ ] Vérifier que les erreurs sont loggées
- [ ] Tester avec un réseau lent (simuler timeout)

### 9.2 Erreurs de Validation
- [ ] Tester avec des données invalides dans les formulaires
- [ ] Vérifier que les messages d'erreur sont clairs
- [ ] Vérifier que les champs invalides sont highlightés

---

## 📝 10. Tests de Régression

### 10.1 Fonctionnalités Existantes
- [ ] Vérifier que toutes les fonctionnalités existantes fonctionnent toujours
- [ ] Vérifier qu'aucune régression n'a été introduite
- [ ] Tester les cas limites

### 10.2 Compatibilité
- [ ] Tester sur Chrome
- [ ] Tester sur Firefox
- [ ] Tester sur Safari
- [ ] Tester sur Edge

---

## ✅ Checklist de Validation Finale

Avant de considérer le système prêt pour la production :

- [ ] Tous les tests ci-dessus sont passés
- [ ] Aucune erreur critique dans les logs
- [ ] Les performances sont acceptables
- [ ] La sécurité est validée
- [ ] La documentation est à jour
- [ ] Les variables d'environnement sont configurées
- [ ] Les clés API sont valides
- [ ] Les migrations SQL sont appliquées

---

**Date de validation** : _______________  
**Validé par** : _______________  
**Notes** : _______________

