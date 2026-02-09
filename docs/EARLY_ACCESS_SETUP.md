# Configuration du Système Early Access

## Vue d'ensemble

Le système d'inscription early access collecte les informations des utilisateurs, les enregistre dans Supabase, et envoie automatiquement un email de confirmation via Resend.

## Fonctionnalités

1. **Formulaire d'inscription amélioré** - Collecte d'informations qualifiantes
2. **Enregistrement Supabase** - Stockage sécurisé des inscriptions
3. **Email automatique** - Confirmation via Resend API
4. **Page de confirmation** - Expérience utilisateur optimisée avec countdown
5. **Tracking** - Suivi des conversions et sources

---

## Configuration Supabase

### 1. Mise à jour de la table `access_requests`

Ajoutez ces colonnes à votre table Supabase :

```sql
-- Ajouter les colonnes pour early access
ALTER TABLE access_requests
ADD COLUMN IF NOT EXISTS early_access BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS launch_date DATE DEFAULT '2025-01-30',
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
```

### 2. Politique RLS (Row Level Security)

Assurez-vous que les utilisateurs anonymes peuvent insérer :

```sql
-- Permettre l'insertion pour les utilisateurs anonymes
CREATE POLICY "Allow anonymous insert" ON access_requests
FOR INSERT
TO anon
WITH CHECK (true);
```

---

## Configuration Resend (Email)

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre domaine ou utilisez `onboarding@resend.dev` pour les tests

### 2. Obtenir la clé API

1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom (ex: "Nucigen Labs Production")
4. Copiez la clé API (commence par `re_...`)

### 3. Configurer les variables d'environnement

Ajoutez ces variables dans votre `.env` local et sur Vercel :

```bash
# Resend Email Configuration
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_RESEND_FROM_EMAIL=Nucigen Labs <noreply@yourdomain.com>
```

**Note** : Pour les tests, vous pouvez utiliser :
```
VITE_RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 4. Configuration Vercel

1. Allez sur [vercel.com](https://vercel.com) → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez :
   - **Key** : `VITE_RESEND_API_KEY`
   - **Value** : Votre clé API Resend
   - **Environments** : ✅ Production ✅ Preview ✅ Development
3. Ajoutez :
   - **Key** : `VITE_RESEND_FROM_EMAIL`
   - **Value** : `Nucigen Labs <noreply@yourdomain.com>` (ou `onboarding@resend.dev` pour les tests)
   - **Environments** : ✅ Production ✅ Preview ✅ Development
4. Redéployez votre application

---

## Flux utilisateur

### 1. Inscription
- L'utilisateur clique sur "Request Early Access"
- Remplit le formulaire dans le modal
- Soumet le formulaire

### 2. Traitement backend
- Enregistrement dans Supabase (`access_requests`)
- Envoi d'email de confirmation via Resend (non-bloquant)
- Redirection vers la page de confirmation

### 3. Page de confirmation
- Affichage du countdown jusqu'au 30 janvier 2025
- Liste des bénéfices early access
- Liens vers d'autres pages

### 4. Email de confirmation
- Email HTML professionnel
- Informations sur le lancement
- Design cohérent avec le site

---

## Structure des données

### Table `access_requests`

```typescript
{
  id: string (UUID)
  email: string (unique, required)
  role?: string
  company?: string
  exposure?: string
  intended_use?: string
  status: 'pending' | 'approved' | 'rejected' (default: 'pending')
  source_page?: string
  early_access: boolean (default: true)
  launch_date: date (default: '2025-01-30')
  email_sent: boolean (default: false)
  email_sent_at?: timestamp
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Personnalisation

### Modifier la date de lancement

Dans `src/lib/supabase.ts` :
```typescript
launch_date: '2025-01-30', // Changez cette date
```

Dans `src/pages/EarlyAccessConfirmation.tsx` :
```typescript
const targetDate = new Date('2025-01-30T15:00:00Z'); // Changez cette date
```

Dans `src/lib/email.ts` :
```typescript
const launchDate = 'January 30, 2025'; // Changez cette date
```

### Modifier le template email

Éditez les fonctions `generateEmailHTML()` et `generateEmailText()` dans `src/lib/email.ts`.

---

## Tests

### Test local

1. Configurez vos variables d'environnement dans `.env`
2. Lancez `npm run dev`
3. Testez le formulaire d'inscription
4. Vérifiez que l'email est envoyé (dans Resend dashboard)

### Test en production

1. Vérifiez que les variables sont configurées sur Vercel
2. Testez le formulaire sur votre site déployé
3. Vérifiez les logs Supabase pour confirmer l'enregistrement
4. Vérifiez les logs Resend pour confirmer l'envoi d'email

---

## Monitoring

### Supabase Dashboard

1. Allez sur votre projet Supabase
2. **Table Editor** → `access_requests`
3. Vérifiez les nouvelles inscriptions
4. Filtrez par `early_access = true`

### Resend Dashboard

1. Allez sur [resend.com](https://resend.com)
2. **Emails** → Voir tous les emails envoyés
3. Vérifiez les taux de livraison et d'ouverture

---

## Prochaines étapes recommandées

1. **Double opt-in** : Ajouter un lien de confirmation dans l'email
2. **Segmentation** : Classer les utilisateurs par rôle/company
3. **Reminders** : Envoyer des rappels avant le lancement
4. **Analytics** : Intégrer Google Analytics ou Plausible
5. **A/B Testing** : Tester différents messages/formulaires

---

## Support

Si vous rencontrez des problèmes :

1. **Email non envoyé** : Vérifiez la clé API Resend et les logs console
2. **Erreur Supabase** : Vérifiez les politiques RLS et la structure de la table
3. **Variables d'environnement** : Vérifiez qu'elles sont bien configurées sur Vercel

---

## Coûts

- **Resend** : Gratuit jusqu'à 100 emails/jour, puis $20/mois pour 50k emails
- **Supabase** : Gratuit jusqu'à 500MB de base de données
- **Vercel** : Gratuit pour les projets personnels

---

## Sécurité

- ✅ Les clés API Resend sont stockées dans les variables d'environnement
- ✅ Supabase RLS protège les données
- ✅ Les emails sont validés avant envoi
- ✅ Pas de données sensibles dans les URLs

