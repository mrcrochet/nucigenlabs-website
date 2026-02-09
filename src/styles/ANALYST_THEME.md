# Thème Analyst / Detective

Spectre de couleurs et de styles pour les vues « analyst-grade » (Search, Detective Investigation, Intelligence). Utiliser le même design pour garder une cohérence produit.

## Où l’utiliser

- **Search** (workspace, cartes résultats, panneau de synthèse)
- **Investigation / Detective** (workspace, hypothèses, preuves)
- **Intelligence** (fiches, indicateurs)
- Toute page qui doit ressembler à un outil analyst (sombre, crédibilité, ton sérieux)

## Avec Tailwind

Le thème expose la palette sous `analyst.*` :

| Usage | Classe Tailwind |
|--------|------------------|
| Fond page | `bg-analyst-bg` |
| Panneau / carte | `bg-analyst-bg-panel` ou `border border-analyst-border` |
| Surface (inputs, zones) | `bg-analyst-bg-surface` |
| Bordure section | `border-analyst-border-section` |
| Texte principal | `text-analyst-text-primary` |
| Texte secondaire | `text-analyst-text-secondary` |
| Texte atténué | `text-analyst-text-muted` / `text-analyst-text-tertiary` |
| Accent (CTA, actif) | `text-analyst-accent` / `border-analyst-accent-strong` |
| Bouton Impact / alerte | `bg-analyst-accent-soft border-analyst-accent-soft-border text-analyst-accent` |
| Relevance (point vert) | `bg-analyst-relevance` |
| Credibility (ambre) | `text-analyst-credibility` |

Exemple bloc type Detective :

```tsx
<div className="bg-analyst-bg text-analyst-text-primary min-h-screen">
  <header className="border-b border-analyst-border-section py-4">
    <h1 className="text-lg font-semibold text-analyst-text-primary">Search Results</h1>
    <p className="text-xs text-analyst-text-tertiary">…</p>
  </header>
  <div className="border border-analyst-border bg-analyst-bg-panel p-5">
    <h3 className="text-sm font-semibold text-analyst-text-secondary">What we see so far</h3>
    …
  </div>
  <button className="bg-analyst-accent-soft border border-analyst-accent-soft-border text-analyst-accent …">
    Generate Impact Brief
  </button>
</div>
```

## Avec CSS (variables)

Les variables sont dans `design-tokens.css` : `--analyst-bg`, `--analyst-bg-panel`, `--analyst-border`, `--analyst-text-primary`, etc.

Classes utilitaires disponibles :  
`bg-analyst`, `bg-analyst-panel`, `bg-analyst-surface`, `border-analyst`, `border-analyst-section`,  
`text-analyst-primary`, `text-analyst-secondary`, `text-analyst-muted`, `text-analyst-tertiary`, `text-analyst-accent`.

## Principes

- **Fond** : noir ou gris très foncé.
- **Panneaux** : `bg-panel` + bordure `border`.
- **Texte** : hiérarchie gray-200 → gray-500.
- **Accent** : rouge (actions, onglet actif, Impact Brief).
- **Sémantique** : vert = relevance, ambre = credibility / avertissement.

Pour harmoniser une nouvelle page : appliquer `bg-analyst-bg` au conteneur principal, puis utiliser les tokens `analyst.*` pour les cartes, bordures et textes.
