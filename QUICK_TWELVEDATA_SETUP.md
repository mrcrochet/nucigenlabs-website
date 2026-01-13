# ⚡ Configuration Rapide Twelve Data

## 🔑 Ajouter votre Clé API

1. **Ouvrir le fichier `.env`** à la racine du projet

2. **Ajouter cette ligne** :
   ```env
   TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7
   ```

3. **Redémarrer le serveur API** :
   ```bash
   # Arrêter le serveur actuel (Ctrl+C)
   npm run api:server
   ```

4. **Tester** :
   ```bash
   curl http://localhost:3001/api/market-data/AAPL
   ```

## ✅ Vérification

Exécuter :
```bash
node check-env.js
```

Vous devriez voir :
```
✅ Variable Twelve Data configurée
```

## 🐛 Si ça ne marche pas

1. **Vérifier que `.env` contient bien la clé** (pas d'espaces avant/après)
2. **Redémarrer le serveur API** (les variables d'environnement sont chargées au démarrage)
3. **Vérifier les logs du serveur** pour voir les erreurs exactes
4. **Ouvrir la console du navigateur** (F12) pour voir les erreurs réseau

## 📝 Note

La clé API est déjà configurée dans le code. Il suffit de l'ajouter dans `.env` et redémarrer le serveur.
