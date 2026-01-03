# PHASE 5: Quick Test Guide

## 🚀 Démarrage Rapide

### 1. **Appliquer la Migration SQL** (OBLIGATOIRE)

1. Ouvrir Supabase Dashboard
2. Aller dans **SQL Editor**
3. Copier-coller le contenu de `phase5_user_preferences_table.sql`
4. Exécuter le script
5. Vérifier qu'il n'y a pas d'erreur

### 2. **Tester l'Onboarding**

1. Démarrer le serveur : `npm run dev`
2. Aller sur `/register`
3. Créer un nouveau compte
4. Vous serez redirigé vers `/onboarding`

**À tester dans l'onboarding** :
- ✅ Vérifier que les 3 étapes s'affichent
- ✅ Step 1 : Remplir les champs de base
- ✅ Step 2 : Utiliser MultiSelect pour sectors/regions/event types
- ✅ Step 2 : Ajouter des Focus Areas (tags)
- ✅ Step 3 : Configurer les préférences de feed
- ✅ Soumettre et vérifier qu'il n'y a pas d'erreur

### 3. **Vérifier le Feed Personnalisé**

1. Aller sur `/intelligence` (ou `/app`)
2. Vérifier que les events se chargent
3. Chercher le badge **"Relevant to you"** (icône Sparkles, rouge)
4. Vérifier que le tri fonctionne selon vos préférences

---

## 🔍 Points de Vérification

### Console Browser (F12)
- ✅ Pas d'erreur `getUserPreferences is not a function`
- ✅ Pas d'erreur `Cannot read property 'preferred_sectors' of null`
- ✅ Pas d'erreur 404 pour les imports

### Supabase Dashboard
- ✅ Table `user_preferences` existe
- ✅ Votre utilisateur a une entrée dans `user_preferences`
- ✅ Les arrays (`preferred_sectors[]`, etc.) sont bien remplis

### UI
- ✅ MultiSelect s'ouvre et permet la sélection multiple
- ✅ Les tags Focus Areas s'affichent et peuvent être supprimés
- ✅ Les sliders fonctionnent
- ✅ Le badge "Relevant to you" apparaît sur certains events

---

## 🐛 Problèmes Courants

### Erreur : "relation 'user_preferences' does not exist"
**Solution** : Appliquer la migration SQL `phase5_user_preferences_table.sql`

### Erreur : "getUserPreferences is not a function"
**Solution** : Vérifier que `src/lib/supabase.ts` contient bien les fonctions `getUserPreferences()` et `updateUserPreferences()`

### Badge "Relevant to you" n'apparaît pas
**Solution** : 
- Vérifier que vous avez des préférences (sectors, regions, event types)
- Vérifier que certains events correspondent à vos préférences
- Le badge n'apparaît que si le score de pertinence >= 0.7

### MultiSelect ne s'ouvre pas
**Solution** : Vérifier que `src/components/ui/MultiSelect.tsx` existe et est importé correctement

---

## ✅ Checklist Rapide

- [ ] Migration SQL appliquée
- [ ] Nouveau compte créé
- [ ] Onboarding complété (3 étapes)
- [ ] Préférences visibles dans Supabase
- [ ] Feed personnalisé fonctionne
- [ ] Badge "Relevant to you" visible
- [ ] Pas d'erreurs dans la console

---

**Bon test ! 🎉**

