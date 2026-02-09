# 🔧 Guide de Correction - Erreur de Contrainte Role

## ❌ Problème

Erreur lors de l'inscription ou de la mise à jour du profil :
```
new row for relation "users" violates check constraint "users_role_check"
```

## 🔍 Cause

Le formulaire d'onboarding envoie un champ `role` qui correspond au **rôle professionnel** (analyst, trader, portfolio_manager, etc.), mais la table `users` attend un **rôle système** ('user', 'early', 'admin').

Quand `updateUserProfile` essaie de mettre à jour le champ `role` avec une valeur comme "analyst", cela viole la contrainte CHECK.

## ✅ Solution

Nous avons ajouté un nouveau champ `professional_role` pour stocker le rôle professionnel, et modifié le code pour mapper correctement les valeurs.

### Étape 1 : Exécuter le script de correction SQL

1. Allez sur votre projet Supabase Dashboard
2. Ouvrez le **SQL Editor**
3. Exécutez le contenu du fichier `FIX_USERS_ROLE_CONSTRAINT.sql`

Ce script va :
- Ajouter le champ `professional_role` à la table `users`
- Migrer les données existantes si nécessaire
- Corriger les valeurs invalides
- Renforcer la contrainte CHECK

### Étape 2 : Vérifier que le code est à jour

Le code a été mis à jour pour :
- ✅ Ajouter `professional_role` à l'interface `User`
- ✅ Modifier `updateUserProfile` pour mapper le rôle professionnel vers `professional_role`
- ✅ Préserver le champ `role` système (user, early, admin)

### Étape 3 : Tester

1. Créez un nouveau compte ou connectez-vous
2. Remplissez le formulaire d'onboarding
3. Vérifiez que l'erreur ne se produit plus

## 📋 Changements Apportés

### Base de données
- ✅ Ajout du champ `professional_role` dans la table `users`
- ✅ Index créé sur `professional_role` pour les requêtes
- ✅ Contrainte CHECK renforcée sur `role`

### Code
- ✅ Interface `User` mise à jour avec `professional_role`
- ✅ Fonction `updateUserProfile` modifiée pour mapper correctement les rôles
- ✅ Le rôle système (`role`) n'est plus écrasé par le rôle professionnel

## 🎯 Résultat

- Le champ `role` contient toujours une valeur système valide ('user', 'early', 'admin')
- Le champ `professional_role` contient le rôle professionnel (analyst, trader, etc.)
- Plus d'erreur de contrainte lors de l'onboarding

## 📝 Notes

- Si vous avez déjà des utilisateurs avec des données invalides, le script SQL les corrigera automatiquement
- Les nouveaux utilisateurs n'auront plus ce problème
- Le champ `professional_role` est optionnel et peut être NULL

