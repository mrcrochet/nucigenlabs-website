# Configuration de la Vérification d'Email avec Code à 4 Chiffres

## Vue d'ensemble

Le système de vérification d'email envoie un code à 4 chiffres à l'utilisateur lorsqu'il s'inscrit. L'utilisateur doit entrer ce code pour confirmer son email avant que son inscription soit finalisée.

## Fonctionnalités

1. **Génération de code** : Code à 4 chiffres généré aléatoirement
2. **Envoi d'email** : Email automatique avec le code via Resend
3. **Vérification** : Interface pour entrer et vérifier le code
4. **Expiration** : Les codes expirent après 15 minutes
5. **Réenvoi** : Possibilité de demander un nouveau code

---

## Configuration Supabase

### 1. Créer la table `email_verification_codes`

Exécutez ce script SQL dans le SQL Editor de Supabase :

```sql
-- Créer la table pour stocker les codes de vérification
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL, -- Code à 4 chiffres
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code_email ON email_verification_codes(code, email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- Activer Row Level Security
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Politique : Permettre aux utilisateurs anonymes d'insérer des codes
CREATE POLICY "Allow anonymous insert verification codes" ON email_verification_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique : Permettre aux utilisateurs anonymes de lire leurs codes
CREATE POLICY "Allow anonymous read own codes" ON email_verification_codes
  FOR SELECT
  TO anon
  USING (true);

-- Politique : Permettre aux utilisateurs anonymes de mettre à jour leurs codes
CREATE POLICY "Allow anonymous update own codes" ON email_verification_codes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Politique : Service role a accès complet
CREATE POLICY "Service role full access verification codes" ON email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fonction pour nettoyer les codes expirés (optionnel, peut être exécuté via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### 2. Vérifier la création

1. Allez dans **Table Editor** → Vous devriez voir `email_verification_codes`
2. Vérifiez que les politiques RLS sont actives dans **Authentication** → **Policies**

---

## Flow Utilisateur

### Étape 1 : Inscription
1. L'utilisateur entre son email (et nom optionnel)
2. Clique sur "Join Waitlist"

### Étape 2 : Envoi du code
1. Un code à 4 chiffres est généré
2. Le code est stocké dans Supabase avec expiration (15 min)
3. Un email est envoyé avec le code

### Étape 3 : Vérification
1. L'utilisateur voit l'interface de vérification
2. Il entre le code à 4 chiffres (4 champs séparés)
3. Le code est vérifié dans Supabase
4. Si valide, l'inscription est finalisée

### Étape 4 : Confirmation
1. L'utilisateur est redirigé vers la page de confirmation
2. Un email de bienvenue est envoyé

---

## Fonctionnalités du Composant

### `EmailVerificationCode`
- **4 champs de saisie** : Un par chiffre
- **Auto-focus** : Passe automatiquement au champ suivant
- **Paste support** : Permet de coller un code à 4 chiffres
- **Auto-verification** : Vérifie automatiquement quand les 4 chiffres sont entrés
- **Réenvoi** : Bouton pour demander un nouveau code
- **Expiration** : Affiche que le code expire en 15 minutes

### `SimpleWaitlistForm`
- **Deux états** :
  1. Formulaire initial (email + nom)
  2. Interface de vérification (après envoi du code)
- **Gestion d'erreurs** : Messages clairs pour chaque erreur
- **Validation** : Vérification de l'email avant envoi

---

## Sécurité

1. **Codes uniques** : Chaque code est unique et aléatoire
2. **Expiration** : Codes expirent après 15 minutes
3. **Single-use** : Chaque code ne peut être utilisé qu'une fois
4. **Nettoyage** : Les anciens codes non vérifiés sont supprimés avant création d'un nouveau

---

## Tests

### Test Manuel

1. **Inscription** :
   - Entrez un email valide
   - Cliquez sur "Join Waitlist"
   - Vérifiez que vous recevez un email avec le code

2. **Vérification** :
   - Entrez le code reçu par email
   - Vérifiez que l'inscription est finalisée

3. **Réenvoi** :
   - Cliquez sur "Resend"
   - Vérifiez qu'un nouveau code est envoyé

4. **Expiration** :
   - Attendez 15 minutes (ou modifiez l'expiration en dev)
   - Essayez d'utiliser un code expiré
   - Vérifiez que cela échoue

### Test en Développement

Si Supabase n'est pas configuré, le système utilise des codes mock :
- Code par défaut : `1234`
- Vérification : Accepte n'importe quel code à 4 chiffres

---

## Dépannage

### Le code n'est pas reçu
- Vérifiez que `VITE_RESEND_API_KEY` est configuré
- Vérifiez les logs de la console pour les erreurs
- Vérifiez que l'email n'est pas dans les spams

### Le code est invalide
- Vérifiez que le code n'a pas expiré (15 minutes)
- Vérifiez que le code n'a pas déjà été utilisé
- Essayez de demander un nouveau code

### Erreur Supabase
- Vérifiez que la table `email_verification_codes` existe
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez les logs Supabase pour les erreurs

---

## Fichiers Modifiés

- `src/lib/supabase.ts` : Fonctions `createVerificationCode()` et `verifyEmailCode()`
- `src/lib/email.ts` : Fonction `sendVerificationCodeEmail()` avec templates HTML/text
- `src/components/SimpleWaitlistForm.tsx` : Intégration du flow de vérification
- `src/components/EmailVerificationCode.tsx` : Nouveau composant pour la saisie du code
- `supabase/migrations/20250130000001_create_email_verification_codes.sql` : Migration SQL

---

## Prochaines Étapes

1. Exécuter la migration SQL dans Supabase
2. Tester le flow complet
3. Configurer un cron job pour nettoyer les codes expirés (optionnel)
4. Monitorer les taux de vérification


