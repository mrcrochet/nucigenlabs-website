# Test Execution Note

## ⚠️ Configuration Requise

Les tests sont créés et prêts, mais nécessitent une correction de configuration environnementale.

### Problème Détecté
- Vitest/vite ne se charge pas correctement depuis node_modules
- Probable problème de résolution de modules avec "type": "module"

### Solution Recommandée

1. **Vérifier l'installation:**
   ```bash
   npm install vite vitest --save-dev
   ```

2. **Exécuter les tests:**
   ```bash
   npm test
   ```

3. **Si problème persiste:**
   - Vérifier que vite et vitest sont bien dans node_modules
   - Vérifier la version de Node.js (recommandé: Node 18+)
   - Essayer avec `npx vitest run` directement

### Tests Prêts

Les tests suivants sont créés et attendent d'être exécutés:

- `src/server/agents/__tests__/event-agent.test.ts`
- `src/server/agents/__tests__/signal-agent.test.ts`

### Structure Conforme

✅ Tous les tests suivent les règles strictes:
- EventAgent: Facts only, no impact/priority
- SignalAgent: Signal[] only, no direct API access

Une fois la configuration corrigée, les tests devraient passer sans modification.
