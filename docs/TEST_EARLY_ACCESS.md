# Test du Système Early Access

## ✅ Configuration Complète

Toutes les variables sont configurées :
- ✅ Supabase (URL + Anon Key)
- ✅ NewsAPI
- ✅ Resend (API Key + From Email)
- ✅ Table `access_requests` créée dans Supabase

## 🧪 Tests à Effectuer

### 1. Test Local

1. Le serveur de développement devrait être lancé
2. Allez sur `http://localhost:5173`
3. Cliquez sur "Request Early Access" (bouton rouge)
4. Remplissez le formulaire avec :
   - Email : votre email de test
   - Role : (optionnel)
   - Company : (optionnel)
   - Exposure : (optionnel)
   - Intended Use : (optionnel)
5. Cliquez sur "Submit Request"

### 2. Vérifications

#### A. Redirection
- ✅ Vous devriez être redirigé vers `/early-access-confirmation?email=...`
- ✅ La page de confirmation s'affiche avec le countdown

#### B. Supabase
1. Allez sur [supabase.com](https://supabase.com) → votre projet
2. **Table Editor** → `access_requests`
3. Vérifiez qu'une nouvelle ligne apparaît avec :
   - Votre email
   - `early_access = true`
   - `launch_date = 2025-01-30`
   - `status = pending`

#### C. Email Resend
1. Allez sur [resend.com](https://resend.com) → **Emails**
2. Vérifiez qu'un email a été envoyé à votre adresse
3. Vérifiez votre boîte mail (y compris les spams)
4. L'email devrait contenir :
   - Titre : "Welcome to Nucigen Labs Early Access"
   - Design cohérent avec le site
   - Informations sur le lancement du 30 janvier 2025

### 3. Test en Production (Vercel)

Une fois déployé sur Vercel :

1. Visitez votre site déployé
2. Testez le formulaire d'inscription
3. Vérifiez les mêmes points que ci-dessus

## 🐛 Dépannage

### Email non reçu
- Vérifiez les logs de la console du navigateur
- Vérifiez le dashboard Resend → **Emails** pour voir les erreurs
- Vérifiez que `VITE_RESEND_API_KEY` est bien configuré

### Erreur Supabase
- Vérifiez que la table `access_requests` existe
- Vérifiez que les politiques RLS permettent l'insertion anonyme
- Vérifiez les logs Supabase dans le dashboard

### Redirection ne fonctionne pas
- Vérifiez que la route `/early-access-confirmation` est bien configurée dans `App.tsx`
- Vérifiez les logs de la console pour les erreurs

## 📊 Monitoring

### Supabase Dashboard
- **Table Editor** : Voir toutes les inscriptions
- **Logs** : Voir les erreurs éventuelles

### Resend Dashboard
- **Emails** : Voir tous les emails envoyés
- **Stats** : Taux de livraison et d'ouverture

## ✨ Prochaines Améliorations Possibles

1. **Double opt-in** : Lien de confirmation dans l'email
2. **Reminders** : Emails de rappel avant le lancement
3. **Analytics** : Tracking des conversions
4. **Segmentation** : Classer les utilisateurs par profil

