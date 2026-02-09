# 🔒 Comment rendre votre repository GitHub privé

## Méthode 1 : Via l'interface web GitHub (Recommandé)

### Étapes :

1. **Allez sur votre repository GitHub**
   - URL : https://github.com/mrcrochet/nucigenlabs-website

2. **Cliquez sur "Settings"** (en haut à droite du repository)

3. **Dans le menu de gauche, descendez jusqu'à "Danger Zone"**

4. **Cliquez sur "Change visibility"**

5. **Sélectionnez "Make private"**

6. **Confirmez en tapant le nom du repository** : `mrcrochet/nucigenlabs-website`

7. **Cliquez sur "I understand, change repository visibility"**

## Méthode 2 : Via GitHub CLI (si installé)

```bash
# Installer GitHub CLI si ce n'est pas déjà fait
# macOS: brew install gh
# Linux: voir https://cli.github.com/

# Se connecter à GitHub
gh auth login

# Rendre le repository privé
gh repo edit mrcrochet/nucigenlabs-website --visibility private
```

## Méthode 3 : Via l'API GitHub

```bash
# Avec un token GitHub (nécessite un Personal Access Token)
curl -X PATCH \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/mrcrochet/nucigenlabs-website \
  -d '{"private":true}'
```

## ⚠️ Points importants

### Avant de rendre privé :

1. **Vérifiez les collaborateurs**
   - Assurez-vous que tous les collaborateurs ont accès
   - Les collaborateurs doivent être ajoutés manuellement pour les repos privés

2. **Vérifiez les secrets/clés API**
   - Les secrets dans `.env.local` ne sont pas commités (c'est bien)
   - Mais vérifiez qu'aucune clé API n'est dans l'historique Git

3. **Vérifiez l'historique Git**
   ```bash
   # Chercher des clés API dans l'historique
   git log --all --full-history --source -- "*env*" "*key*" "*secret*"
   ```

### Après avoir rendu privé :

1. **Les URLs publiques ne fonctionneront plus**
   - Les liens vers le repository ne seront accessibles qu'aux collaborateurs
   - Les webhooks publics devront être mis à jour

2. **Les forks publics seront conservés**
   - Si quelqu'un a fork votre repo avant qu'il soit privé, le fork reste public
   - Vous ne pouvez pas forcer la suppression des forks

3. **GitHub Actions**
   - Les workflows GitHub Actions continueront de fonctionner
   - Mais les logs seront privés

## 🔐 Vérification de sécurité

### Vérifier qu'aucune clé n'est dans le code :

```bash
# Chercher des patterns de clés API
git grep -i "api_key\|secret_key\|password\|token" -- ':!*.md' ':!node_modules'

# Vérifier l'historique Git pour des secrets
git log --all --full-history -p | grep -i "api_key\|secret\|password\|token"
```

### Si vous trouvez des secrets :

1. **Rendez le repo privé immédiatement**
2. **Régénérez toutes les clés exposées**
3. **Utilisez `git-filter-repo` ou `BFG Repo-Cleaner` pour nettoyer l'historique**
4. **Force push** (⚠️ attention : cela réécrit l'historique)

## 📝 Checklist avant de rendre privé

- [ ] Vérifier qu'aucune clé API n'est dans le code
- [ ] Vérifier qu'aucune clé API n'est dans l'historique Git
- [ ] Ajouter tous les collaborateurs nécessaires
- [ ] Sauvegarder les URLs importantes (webhooks, CI/CD)
- [ ] Informer l'équipe du changement

## 🚀 Après avoir rendu privé

Votre repository sera :
- ✅ Accessible uniquement aux collaborateurs
- ✅ Non indexé par les moteurs de recherche
- ✅ Protégé contre les accès non autorisés
- ✅ Éligible pour GitHub Private Repositories (gratuit pour les comptes personnels)

## 💡 Alternative : GitHub Private Repositories

Si vous avez un compte GitHub gratuit, vous pouvez avoir des repositories privés illimités depuis 2019.

