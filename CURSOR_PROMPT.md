# Prompt pour Cursor - Implémentation du Design System

Copiez-collez ce prompt dans Cursor pour votre projet principal :

---

```
Je veux implémenter un design system cohérent dans mon projet. Voici les spécifications de design que je veux suivre :

## CONTEXTE
J'ai une landing page avec un design spécifique que je veux réutiliser comme référence pour ce projet. Les fichiers de design system sont disponibles dans ce workspace.

## DESIGN SYSTEM À SUIVRE

### Palette de Couleurs
- **Couleur primaire** : `#E1463E` (rouge signature)
- **Fond principal** : `#0A0A0A` (presque noir)
- **Texte primaire** : `#FFFFFF` (blanc)
- **Texte secondaire** : `rgba(148, 163, 184, 1)` (slate-400)
- **Texte tertiaire** : `rgba(100, 116, 139, 1)` (slate-500)

### Typographie
- **Police** : 'Inter', system-ui, -apple-system, sans-serif
- **Poids** : Utiliser principalement `font-light` (300) et `font-extralight` (200)
- **Letter spacing** : `tracking-[0.15em]` à `tracking-[0.25em]` pour les labels/badges
- **Hiérarchie** :
  - H1: `text-5xl md:text-7xl lg:text-8xl font-light`
  - H2: `text-4xl md:text-5xl font-extralight`
  - Body: `text-lg md:text-xl font-light text-slate-400`

### Glass Morphism (Effet Principal)
Tous les containers/cards doivent utiliser :
```css
backdrop-blur-xl
bg-gradient-to-br from-white/[0.08] to-white/[0.02]
border border-white/[0.15]
rounded-2xl
```

Variantes :
- Subtle: `from-white/[0.03] to-white/[0.01] border-white/[0.08]`
- Medium: `from-white/[0.05] to-white/[0.02] border-white/[0.08]`
- Strong: `from-white/[0.08] to-white/[0.02] border-white/[0.15]`

### Composants Standards

**Badge/Tag** :
```
inline-block backdrop-blur-xl 
bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 
border border-[#E1463E]/20 
rounded-full px-6 py-2
text-sm text-[#E1463E] font-light tracking-[0.15em]
```

**Button Primary** :
```
bg-[#E1463E] hover:bg-[#E1463E]/90 
text-white font-normal 
px-10 py-4 rounded-lg
transition-all duration-150
hover:scale-105 hover:shadow-[0_0_35px_rgba(225,70,62,0.4)]
focus:outline-none focus:ring-2 focus:ring-[#E1463E] focus:ring-offset-2
```

**Card avec Hover** :
```
backdrop-blur-xl 
bg-gradient-to-br from-white/[0.05] to-white/[0.02] 
border border-white/[0.08] 
rounded-2xl p-12
hover:border-white/[0.15] hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1
transition-all duration-500
```

### Animations et Transitions
- **Durées** : 150ms (fast), 300ms (medium), 500ms (slow)
- **Hover effects** : `hover:scale-105` pour les boutons
- **GPU acceleration** : Utiliser `will-change: transform, opacity` et `transform: translateZ(0)` pour les animations
- **Respecter** : `prefers-reduced-motion` pour l'accessibilité

### Espacements
- **Sections** : `py-24` (vertical), `px-6` (horizontal)
- **Containers** : `max-w-5xl` (largeur principale), `max-w-7xl` (navigation)
- **Padding cards** : `p-12` ou `p-16`

### Principes de Design
1. **Minimalisme élégant** : Espaces blancs généreux, typographie légère
2. **Profondeur** : Glass morphism pour créer des couches visuelles
3. **Interactivité subtile** : Hover effects discrets (scale, shadow, border)
4. **Hiérarchie claire** : Contrastes forts (blanc sur noir), tailles variées
5. **Performance** : Animations optimisées GPU, lazy loading

### Accessibilité
- Toujours inclure `focus:outline-none focus:ring-2` sur les éléments interactifs
- Maintenir un contraste suffisant (WCAG AA minimum)
- Respecter `prefers-reduced-motion`
- Ajouter des `aria-label` appropriés

## INSTRUCTIONS

Quand je te demande de créer ou modifier des composants :

1. **Suis strictement** la palette de couleurs et les styles définis ci-dessus
2. **Utilise le glass morphism** pour tous les containers/cards importants
3. **Applique la typographie** avec les poids light/extralight
4. **Implémente les animations** de manière subtile et performante
5. **Respecte l'accessibilité** avec les focus states et ARIA labels
6. **Optimise les performances** avec GPU acceleration où nécessaire

Si tu as besoin de plus de détails, consulte les fichiers DESIGN_SYSTEM.md, QUICK_REFERENCE.md, et CODE_EXAMPLES.md dans ce workspace.

Commence par analyser la structure actuelle du projet et propose-moi comment intégrer ce design system de manière cohérente.
```

---

## Comment utiliser ce prompt

1. **Ouvrez Cursor** dans votre projet principal
2. **Copiez le prompt** ci-dessus (tout le contenu entre les ```)
3. **Collez-le dans le chat** de Cursor
4. **Ajoutez les fichiers de design** (DESIGN_SYSTEM.md, etc.) dans votre workspace si nécessaire
5. **Commencez à travailler** avec l'IA qui comprendra votre design system

## Variantes du prompt selon vos besoins

### Pour créer un composant spécifique :
```
Crée un composant [NomDuComposant] en suivant strictement le design system défini. 
Utilise le glass morphism, la palette de couleurs #E1463E/#0A0A0A, et la typographie Inter light.
```

### Pour modifier un composant existant :
```
Modifie [NomDuComposant] pour qu'il suive le design system : 
glass morphism, couleurs #E1463E/#0A0A0A, typographie Inter light, animations subtiles.
```

### Pour créer une page complète :
```
Crée une page [NomDeLaPage] en suivant le design system. 
Utilise les patterns de glass morphism, la hiérarchie typographique définie, 
et les espacements standards (py-24, max-w-5xl).
```

---

*Ce prompt est optimisé pour Cursor et contient toutes les informations nécessaires pour implémenter le design de manière cohérente.*

