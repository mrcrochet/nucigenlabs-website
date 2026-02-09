# Configuration Resend - Guide Rapide

## ✅ Votre clé API Resend

```
VITE_RESEND_API_KEY=re_NjpCUge6_2rv7NpmvPdmYyTPrR7gpHLCJ
```

## Configuration Locale (.env)

Ajoutez ces lignes à votre fichier `.env` :

```bash
# Resend Email Configuration
VITE_RESEND_API_KEY=re_NjpCUge6_2rv7NpmvPdmYyTPrR7gpHLCJ
VITE_RESEND_FROM_EMAIL=Nucigen Labs <onboarding@resend.dev>
```

**Note** : Pour les tests, utilisez `onboarding@resend.dev`. Pour la production, vous devrez vérifier votre propre domaine dans Resend.

## Configuration Vercel (Production)

### Étape 1 : Accéder aux variables d'environnement
1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet `nucigenlabs-website`
3. Cliquez sur **Settings** (Paramètres)
4. Dans le menu de gauche, cliquez sur **Environment Variables**

### Étape 2 : Ajouter VITE_RESEND_API_KEY
1. Cliquez sur **Add New**
2. **Key** : `VITE_RESEND_API_KEY`
3. **Value** : `re_NjpCUge6_2rv7NpmvPdmYyTPrR7gpHLCJ`
4. **Environments** : ✅ Production ✅ Preview ✅ Development
5. Cliquez sur **Save**

### Étape 3 : Ajouter VITE_RESEND_FROM_EMAIL
1. Cliquez sur **Add New**
2. **Key** : `VITE_RESEND_FROM_EMAIL`
3. **Value** : `Nucigen Labs <onboarding@resend.dev>` (pour les tests)
   - Ou `Nucigen Labs <noreply@votredomaine.com>` (pour la production)
4. **Environments** : ✅ Production ✅ Preview ✅ Development
5. Cliquez sur **Save**

### Étape 4 : Redéployer
1. Allez dans l'onglet **Deployments**
2. Cliquez sur les **3 points** (⋯) à côté du dernier déploiement
3. Sélectionnez **Redeploy**
4. Ou poussez un nouveau commit sur GitHub

## Vérification

Pour tester que l'email fonctionne :

1. Remplissez le formulaire "Request Early Access" sur votre site
2. Vérifiez dans le dashboard Resend :
   - Allez sur [resend.com](https://resend.com) → **Emails**
   - Vous devriez voir l'email envoyé
3. Vérifiez votre boîte mail (y compris les spams)

## Prochaines étapes (Optionnel)

### Vérifier votre domaine (pour la production)

1. Dans Resend, allez dans **Domains**
2. Ajoutez votre domaine (ex: `nucigenlabs.com`)
3. Suivez les instructions DNS pour vérifier
4. Une fois vérifié, changez `VITE_RESEND_FROM_EMAIL` pour utiliser votre domaine

## Limites Resend

- **Gratuit** : 100 emails/jour
- **Pro** : $20/mois pour 50,000 emails/mois

## Sécurité

⚠️ **Important** : Ne commitez JAMAIS votre clé API dans Git. Elle est déjà dans `.gitignore`.

✅ La clé est stockée de manière sécurisée dans les variables d'environnement Vercel.

