# 🔧 Désactiver la Confirmation d'Email en Développement

## Problème

Après l'inscription, vous voyez "User not authenticated" sur la page d'onboarding. Cela se produit parce que Supabase nécessite une confirmation d'email par défaut.

## Solution : Désactiver la confirmation d'email en développement

### Étapes dans Supabase Dashboard

1. **Allez sur votre projet Supabase** : https://app.supabase.com
2. **Authentication** → **Settings** (dans le menu de gauche)
3. **Scroll jusqu'à "Email Auth"**
4. **Désactivez** le toggle **"Enable email confirmations"**
5. **Cliquez sur "Save"**

### Alternative : Configurer les emails de développement

Si vous voulez garder la confirmation d'email activée mais utiliser des emails de test :

1. **Authentication** → **Settings**
2. **Scroll jusqu'à "SMTP Settings"**
3. Configurez un service SMTP (SendGrid, Mailgun, etc.)
4. Ou utilisez **Supabase Inbucket** pour les emails de développement local

## Vérification

Après avoir désactivé la confirmation d'email :

1. **Redémarrez votre serveur de développement** (si nécessaire)
2. **Créez un nouveau compte**
3. Vous devriez être **automatiquement connecté** après l'inscription
4. Vous devriez être **redirigé vers `/onboarding`**

## Notes importantes

- ⚠️ **En production**, il est recommandé de **garder la confirmation d'email activée** pour la sécurité
- ✅ **En développement**, vous pouvez la désactiver pour faciliter les tests
- 🔒 La confirmation d'email protège contre les inscriptions avec des emails invalides

## Si vous gardez la confirmation d'email activée

Si vous gardez la confirmation d'email activée, voici ce qui se passera :

1. L'utilisateur s'inscrit
2. Supabase envoie un email de confirmation
3. L'utilisateur clique sur le lien dans l'email
4. L'utilisateur est redirigé vers `/auth/callback`
5. La session est créée
6. L'utilisateur est redirigé vers `/onboarding` ou `/app`

Dans ce cas, vous devrez vérifier votre boîte email (et les spams) pour confirmer votre compte.

