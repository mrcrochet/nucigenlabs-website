# Configuration Supabase Auth pour l'inscription

## ✅ Ce qui a été fait

Le système d'inscription utilise maintenant **Supabase Auth** au lieu du système custom avec codes de vérification.

### Avantages

1. **Gestion automatique des emails** : Supabase envoie automatiquement les emails de confirmation
2. **Pas besoin de Resend** : Plus besoin de configurer Resend pour les emails de vérification
3. **Sécurité intégrée** : Supabase gère la sécurité, les tokens, etc.
4. **Plus simple** : Moins de code à maintenir

## 🔧 Configuration requise dans Supabase

### 1. Activer l'authentification par email

1. Allez sur votre projet Supabase : https://supabase.com/dashboard
2. Cliquez sur **Authentication** dans le menu de gauche
3. Allez dans **Providers**
4. Assurez-vous que **Email** est activé

### 2. Configurer les emails de confirmation

1. Dans **Authentication** → **Email Templates**
2. Personnalisez le template **Confirm signup** si vous le souhaitez
3. Ou utilisez le template par défaut

### 3. Configurer l'URL de redirection

1. Dans **Authentication** → **URL Configuration**
2. Ajoutez votre URL de production dans **Site URL** :
   - Exemple : `https://nucigenlabs.com`
3. Ajoutez les URLs autorisées dans **Redirect URLs** :
   - `https://nucigenlabs.com/early-access-confirmation`
   - `http://localhost:5173/early-access-confirmation` (pour le développement)

### 4. Désactiver la confirmation d'email (optionnel)

Si vous voulez que les utilisateurs soient automatiquement confirmés (sans vérification d'email) :

1. Allez dans **Authentication** → **Settings**
2. Désactivez **Enable email confirmations**

⚠️ **Note** : Pour la production, il est recommandé de garder la confirmation d'email activée.

## 📧 Template d'email personnalisé (optionnel)

Vous pouvez personnaliser l'email de confirmation dans Supabase :

1. **Authentication** → **Email Templates** → **Confirm signup**
2. Personnalisez le sujet et le contenu HTML
3. Utilisez `{{ .ConfirmationURL }}` pour le lien de confirmation

Exemple de template :
```
Subject: Confirm your email - Nucigen Labs

Hi there!

Click the link below to confirm your email and complete your registration:

{{ .ConfirmationURL }}

If you didn't request this, you can safely ignore this email.

Best regards,
The Nucigen Labs Team
```

## 🔄 Comment ça fonctionne maintenant

1. **Utilisateur remplit le formulaire** avec email et nom
2. **Supabase Auth crée un compte** avec `signUp()`
3. **Supabase envoie automatiquement** un email de confirmation
4. **L'utilisateur clique sur le lien** dans l'email
5. **Supabase confirme le compte** et redirige vers `/early-access-confirmation`
6. **L'email est aussi sauvegardé** dans la table `access_requests` (waitlist)

## 🧪 Test

1. Remplissez le formulaire d'inscription
2. Vérifiez votre boîte email (et les spams)
3. Cliquez sur le lien de confirmation
4. Vous devriez être redirigé vers la page de confirmation

## ⚠️ Notes importantes

- Les utilisateurs doivent **confirmer leur email** avant d'être complètement inscrits
- Si un utilisateur existe déjà, le système l'informe mais continue quand même
- Le mot de passe est généré automatiquement (l'utilisateur n'a pas besoin de le connaître)
- Pour se connecter plus tard, l'utilisateur devra utiliser "Forgot password"

## 🔐 Sécurité

- Supabase gère automatiquement la sécurité des tokens
- Les emails de confirmation expirent après un certain temps
- Les mots de passe sont hashés automatiquement
- RLS (Row Level Security) est toujours actif sur les tables

