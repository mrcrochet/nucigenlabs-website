# 🔧 Dépannage Twelve Data API

## Erreur : "apikey parameter is incorrect or not specified"

Cette erreur signifie que la clé API n'est pas correctement passée à l'API Twelve Data.

### ✅ Solutions

#### 1. Vérifier que la clé est dans `.env`

Ouvrez votre fichier `.env` à la racine du projet et vérifiez qu'il contient :

```env
TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7
```

**Points importants :**
- ✅ Pas d'espaces avant ou après le `=`
- ✅ Pas de guillemets autour de la valeur
- ✅ Pas de ligne vide ou de commentaire sur la même ligne
- ✅ Le nom de la variable est exactement `TWELVEDATA_API_KEY` (majuscules)

#### 2. Vérifier l'emplacement du fichier `.env`

Le fichier `.env` doit être à la **racine du projet** (même niveau que `package.json`).

```
nucigenlabs-landingpage/
├── .env                    ← ICI
├── package.json
├── src/
└── ...
```

#### 3. Redémarrer le serveur API

**IMPORTANT** : Les variables d'environnement sont chargées au démarrage du serveur. Vous devez **redémarrer** après avoir modifié `.env`.

```bash
# 1. Arrêter le serveur actuel (Ctrl+C ou Cmd+C)
# 2. Redémarrer
npm run api:server
# ou
npx tsx src/server/api-server.ts
```

#### 4. Vérifier les logs du serveur

Au démarrage, vous devriez voir :

```
[Twelve Data] ✅ API key loaded (353b64f9...)
```

Si vous voyez :

```
[Twelve Data] ⚠️  TWELVEDATA_API_KEY not found in environment variables
```

Cela signifie que la clé n'est pas chargée. Vérifiez :
- Le fichier `.env` existe
- La variable est bien nommée `TWELVEDATA_API_KEY`
- Le serveur a été redémarré

#### 5. Tester la clé directement

Testez votre clé API avec curl :

```bash
curl "https://api.twelvedata.com/price?symbol=AAPL&apikey=353b64f9e9d34f5f908b0450049ed5a7"
```

Si cela fonctionne, la clé est valide. Le problème vient du chargement dans le serveur.

#### 6. Vérifier le format du `.env`

**❌ Incorrect :**
```env
TWELVEDATA_API_KEY = 353b64f9e9d34f5f908b0450049ed5a7  # Espaces
TWELVEDATA_API_KEY="353b64f9e9d34f5f908b0450049ed5a7"  # Guillemets
TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7 # Commentaire sur même ligne
```

**✅ Correct :**
```env
TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7
```

#### 7. Vérifier que dotenv charge le fichier

Le service charge le `.env` depuis plusieurs emplacements. Vérifiez que le fichier est bien lu :

```bash
# Dans le terminal, depuis la racine du projet
node -e "require('dotenv').config(); console.log(process.env.TWELVEDATA_API_KEY)"
```

Cela devrait afficher votre clé API.

### 🔍 Diagnostic Avancé

#### Vérifier les variables d'environnement chargées

Ajoutez temporairement ce code dans `src/server/services/twelvedata-service.ts` après le chargement de dotenv :

```typescript
console.log('Environment check:');
console.log('TWELVEDATA_API_KEY exists:', !!process.env.TWELVEDATA_API_KEY);
console.log('TWELVEDATA_API_KEY length:', process.env.TWELVEDATA_API_KEY?.length);
console.log('All env vars with TWELVE:', Object.keys(process.env).filter(k => k.includes('TWELVE')));
```

#### Vérifier le chemin du `.env`

Le service cherche le `.env` dans ces emplacements :
1. `src/server/../../../.env` (racine du projet)
2. `src/server/../../../../.env` (parent du projet)
3. `.env` (répertoire courant)

Assurez-vous que votre `.env` est dans l'un de ces emplacements.

### 📝 Checklist de Vérification

- [ ] Fichier `.env` existe à la racine du projet
- [ ] Variable `TWELVEDATA_API_KEY` est présente dans `.env`
- [ ] Pas d'espaces autour du `=`
- [ ] Pas de guillemets autour de la valeur
- [ ] Serveur API redémarré après modification
- [ ] Logs du serveur montrent "API key loaded"
- [ ] Test avec curl fonctionne

### 🆘 Si Rien ne Fonctionne

1. **Vérifier la clé API sur le dashboard Twelve Data**
   - Aller sur https://twelvedata.com/
   - Se connecter
   - Vérifier que la clé est active

2. **Créer un nouveau fichier `.env`**
   - Supprimer l'ancien
   - Créer un nouveau avec seulement :
     ```env
     TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7
     ```

3. **Vérifier les permissions du fichier**
   - Le fichier doit être lisible
   - Pas de caractères spéciaux dans le nom

4. **Contacter le support**
   - Si la clé fonctionne avec curl mais pas dans le serveur
   - Vérifier les logs complets du serveur
   - Partager les logs (sans la clé API complète)
