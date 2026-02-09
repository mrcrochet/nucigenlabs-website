# 🔍 Diagnostic des problèmes d'email

## Problème : Vous ne recevez pas d'emails de vérification

### ✅ Vérifications à faire

#### 1. **Vérifier la console du navigateur**
   - Ouvrez les DevTools (F12)
   - Allez dans l'onglet "Console"
   - Essayez d'envoyer un email
   - Cherchez les messages avec 📧, ✅ ou ❌

#### 2. **Vérifier les variables d'environnement**
   ```bash
   # Vérifiez que ces variables existent dans .env
   VITE_RESEND_API_KEY=re_...
   VITE_RESEND_FROM_EMAIL=Nucigen Labs <onboarding@resend.dev>
   ```

#### 3. **Redémarrer le serveur de développement**
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   # Puis relancez-le
   npm run dev
   ```
   ⚠️ Les variables d'environnement ne sont chargées qu'au démarrage !

#### 4. **Vérifier votre clé API Resend**
   - Allez sur https://resend.com/api-keys
   - Vérifiez que votre clé API est active
   - Vérifiez qu'elle n'a pas expiré

#### 5. **Vérifier les spams**
   - Les emails peuvent aller dans les spams
   - Vérifiez aussi le dossier "Promotions" (Gmail)

#### 6. **Tester l'API Resend directement**
   ```bash
   # Testez avec votre email
   node test-resend-api.js votre-email@example.com
   ```

### 🔴 Erreurs courantes

#### Erreur : "Resend API key not configured"
**Solution :**
- Vérifiez que `.env` existe à la racine du projet
- Vérifiez que `VITE_RESEND_API_KEY` est bien défini
- Redémarrez le serveur de développement

#### Erreur : "403 Forbidden"
**Solution :**
- Votre clé API est invalide ou expirée
- Générez une nouvelle clé sur https://resend.com/api-keys

#### Erreur : "422 Unprocessable Entity"
**Solution :**
- Vérifiez le format de l'email destinataire
- Vérifiez que le domaine d'envoi est correct
- `onboarding@resend.dev` devrait fonctionner par défaut

#### Pas d'erreur mais pas d'email reçu
**Solutions :**
1. Vérifiez les spams
2. Vérifiez que l'email est valide
3. Testez avec un autre email
4. Vérifiez les logs Resend sur https://resend.com/emails

### 🧪 Test manuel de l'API

Vous pouvez tester l'API Resend directement avec curl :

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_NjpCUge6_2rv7NpmvPdmYyTPrR7gpHLCJ" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Nucigen Labs <onboarding@resend.dev>",
    "to": "votre-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

### 📊 Vérifier les logs Resend

1. Allez sur https://resend.com/emails
2. Connectez-vous à votre compte
3. Vérifiez l'historique des emails envoyés
4. Vérifiez les erreurs éventuelles

### 🔧 Solutions avancées

#### Si vous utilisez un domaine personnalisé
- Vérifiez que le domaine est vérifié dans Resend
- Utilisez `VITE_RESEND_FROM_EMAIL` avec votre domaine
- Exemple : `Nucigen Labs <noreply@votredomaine.com>`

#### Si vous êtes en développement local
- Les emails peuvent être bloqués par certains fournisseurs
- Testez avec Gmail, Outlook, ou un service de test email
- Utilisez https://mailtrap.io pour tester en développement

### 📞 Support

Si le problème persiste :
1. Vérifiez tous les logs dans la console
2. Copiez les messages d'erreur
3. Vérifiez le statut de votre compte Resend
4. Contactez le support Resend si nécessaire

