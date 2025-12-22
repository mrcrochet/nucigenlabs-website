# Design System - Nucigen Labs
## Guide de référence pour le projet principal

Ce document extrait tous les éléments de design de la landing page pour servir de référence dans le projet principal.

---

## 🎨 Palette de Couleurs

### Couleurs Principales

```css
/* Couleur primaire - Rouge signature */
Primary Red: #E1463E
Primary Red Hover: #E1463E/90 (90% opacity)
Primary Red Light: rgba(225, 70, 62, 0.4)

/* Fond principal */
Background: #0A0A0A (presque noir)
Background Overlay: rgba(10, 10, 10, 0.8)

/* Texte */
Text Primary: #FFFFFF (blanc pur)
Text Secondary: rgba(148, 163, 184, 1) /* slate-400 */
Text Tertiary: rgba(100, 116, 139, 1) /* slate-500 */
Text Muted: rgba(71, 85, 105, 1) /* slate-600 */
Text Dark: rgba(51, 65, 85, 1) /* slate-700 */
```

### Couleurs d'Accent

```css
/* Gradients rouges/oranges */
Red-Orange Gradient: from-red-500/20 to-orange-500/20
Red-Orange Border: from-red-400 to-orange-400

/* Couleurs de niveau (Four Levels) */
Geopolitical: red-500/10, red-500/5, red-900/30
Industrial: orange-500/10, orange-500/5, orange-900/30
Supply Chain: blue-500/10, blue-500/5, blue-900/30
Market: green-500/10, green-500/5, green-900/30
```

### Opacités et Transparences

```css
/* Overlays et backgrounds */
Glass Effect: white/[0.08] to white/[0.02]
Glass Border: white/[0.15]
Glass Subtle: white/[0.03] to white/[0.01]
Glass Border Subtle: white/[0.08]

/* Backdrop blur */
Backdrop Blur Light: backdrop-blur-sm
Backdrop Blur Medium: backdrop-blur-xl
Backdrop Blur Heavy: backdrop-blur-2xl
```

---

## ✍️ Typographie

### Police de Caractères

```css
Font Family: 'Inter', system-ui, -apple-system, sans-serif
Font Loading: Google Fonts (weights: 300, 400, 500, 600, 700)
```

### Hiérarchie Typographique

```css
/* Headings */
H1: 
  - Mobile: text-5xl (3rem / 48px)
  - Tablet: text-7xl (4.5rem / 72px)
  - Desktop: text-8xl (6rem / 96px)
  - Weight: font-light (300)
  - Line Height: leading-[1.1]
  - Color: text-white

H2:
  - Mobile: text-4xl (2.25rem / 36px)
  - Desktop: text-5xl (3rem / 48px)
  - Weight: font-extralight (200) ou font-light (300)
  - Color: text-white

H3:
  - Size: text-2xl (1.5rem / 24px)
  - Weight: font-light (300)
  - Color: text-slate-100 ou text-white

/* Body Text */
Body Large:
  - Mobile: text-lg (1.125rem / 18px)
  - Desktop: text-xl (1.25rem / 20px)
  - Weight: font-light (300)
  - Color: text-slate-400
  - Line Height: leading-relaxed

Body Regular:
  - Mobile: text-base (1rem / 16px)
  - Desktop: text-lg (1.125rem / 18px)
  - Weight: font-light (300)
  - Color: text-slate-500

Body Small:
  - Size: text-sm (0.875rem / 14px)
  - Weight: font-light (300)
  - Color: text-slate-400 ou text-slate-500

/* Labels et Badges */
Label:
  - Size: text-xs (0.75rem / 12px)
  - Weight: font-light (300)
  - Letter Spacing: tracking-[0.2em] ou tracking-[0.25em]
  - Color: text-slate-500, text-slate-600, ou text-[#E1463E]
```

### Caractéristiques Typographiques

```css
/* Letter Spacing */
Tight: tracking-tight
Normal: tracking-wide
Wide: tracking-[0.15em]
Extra Wide: tracking-[0.2em] ou tracking-[0.25em]

/* Font Smoothing */
-webkit-font-smoothing: antialiased
-moz-osx-font-smoothing: grayscale
```

---

## 📐 Espacements et Layout

### Container Widths

```css
Max Width Small: max-w-3xl (48rem / 768px)
Max Width Medium: max-w-4xl (56rem / 896px)
Max Width Large: max-w-5xl (64rem / 1024px)
Max Width XL: max-w-6xl (72rem / 1152px)
Max Width 2XL: max-w-7xl (80rem / 1280px)
```

### Padding et Margins

```css
/* Section Padding */
Section Vertical: py-24 (6rem / 96px)
Section Vertical Large: py-32 (8rem / 128px)
Section Horizontal: px-6 (1.5rem / 24px)

/* Component Padding */
Card Padding: p-8 (2rem / 32px) ou p-10 (2.5rem / 40px)
Card Padding Large: p-12 (3rem / 48px) ou p-16 (4rem / 64px)

/* Button Padding */
Button Small: px-4 py-2
Button Medium: px-6 py-3
Button Large: px-10 py-4

/* Gaps */
Gap Small: gap-1 (0.25rem / 4px)
Gap Medium: gap-3 (0.75rem / 12px) ou gap-4 (1rem / 16px)
Gap Large: gap-6 (1.5rem / 24px) ou gap-8 (2rem / 32px)
```

---

## 🎭 Effets Visuels

### Glass Morphism

```css
/* Style de base */
background: backdrop-blur-xl
background-gradient: bg-gradient-to-br from-white/[0.08] to-white/[0.02]
border: border border-white/[0.15]
border-radius: rounded-2xl
shadow: shadow-2xl

/* Variantes */
Glass Subtle:
  - from-white/[0.03] to-white/[0.01]
  - border-white/[0.08]

Glass Medium:
  - from-white/[0.05] to-white/[0.02]
  - border-white/[0.08]

Glass Strong:
  - from-white/[0.08] to-white/[0.02]
  - border-white/[0.15]
```

### Ombres et Glows

```css
/* Shadow sur fond sombre */
Shadow Subtle: shadow-[0_1px_0_0_rgba(255,255,255,0.02)]
Shadow Medium: shadow-2xl shadow-white/[0.03]
Shadow Glow Red: shadow-[0_0_35px_rgba(225,70,62,0.4)]
Shadow Glow Red Small: shadow-[0_0_25px_rgba(225,70,62,0.35)]

/* Hover Effects */
Hover Scale: hover:scale-105
Hover Scale Large: hover:scale-[1.02]
Hover Shadow: hover:shadow-xl hover:shadow-[#E1463E]/30
```

### Bordures

```css
/* Bordures standards */
Border Subtle: border border-white/[0.08]
Border Medium: border border-white/[0.15]
Border Strong: border border-white/[0.2]

/* Bordures colorées */
Border Red: border-[#E1463E]/20
Border Red Strong: border-[#E1463E]/30

/* Border Radius */
Radius Small: rounded-lg
Radius Medium: rounded-xl
Radius Large: rounded-2xl
Radius Full: rounded-full
```

---

## 🎬 Animations

### Durées de Transition

```css
Fast: duration-150 (150ms)
Medium: duration-300 (300ms)
Slow: duration-500 (500ms)
Very Slow: duration-700 (700ms)
```

### Animations Personnalisées

```css
/* Glow Pulse */
Animation: glow-pulse 10s ease-in-out infinite
Effet: Scale et opacity pulse

/* Glow Drift */
Animation: glow-drift 18s ease-in-out infinite
Effet: Translation lente avec changement d'opacité

/* Data Flow */
Animation: data-flow 12s ease-in-out infinite
Effet: Translation horizontale avec fade

/* Shimmer */
Animation: shimmer 2s infinite
Effet: Translation horizontale pour effet brillant

/* Float */
Animation: float 6s ease-in-out infinite
Effet: Translation verticale douce
```

### Easing Functions

```css
Ease In Out: ease-in-out
Ease Out: ease-out
Linear: linear (pour animations continues)
```

### GPU Acceleration

```css
/* Pour performances optimales */
will-change: transform, opacity
transform: translateZ(0) /* Force GPU layer */
```

---

## 🧩 Composants Réutilisables

### Badge / Tag

```css
/* Style de base */
display: inline-block
padding: px-6 py-2 (ou px-4 py-1.5)
background: backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5
border: border border-[#E1463E]/20
border-radius: rounded-full
text: text-sm text-[#E1463E] font-light tracking-[0.15em]
```

### Card / Container

```css
/* Style de base */
background: backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02]
border: border border-white/[0.08]
border-radius: rounded-2xl
padding: p-12
hover: hover:border-white/[0.15] hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1
transition: transition-all duration-500
```

### Button Primary

```css
/* Style de base */
background: bg-[#E1463E]
hover: hover:bg-[#E1463E]/90
text: text-white font-normal
padding: px-10 py-4
border-radius: rounded-lg
transition: transition-all duration-150
hover-effects: hover:scale-105 hover:shadow-[0_0_35px_rgba(225,70,62,0.4)]
focus: focus:outline-none focus:ring-2 focus:ring-[#E1463E] focus:ring-offset-2
```

### Button Secondary

```css
/* Style de base */
border: border border-white/20
hover: hover:border-white/40 hover:bg-white/[0.05]
text: text-white font-light
padding: px-6 py-3
border-radius: rounded-lg
transition: transition-all duration-300
```

### Input / Form Field

```css
/* Style de base */
background: bg-black/60 backdrop-blur-xl
border: border border-white/10
border-radius: rounded-lg
padding: px-4 py-3
text: text-white placeholder:text-slate-700
focus: focus:outline-none focus:border-white/30
transition: transition-all
font: text-sm font-light
```

---

## 🎯 Principes de Design

### 1. Minimalisme Élégant
- Espaces blancs généreux
- Typographie légère (font-light, font-extralight)
- Couleurs sobres avec accents rouges

### 2. Profondeur et Dimension
- Glass morphism pour créer des couches
- Backdrop blur pour séparation visuelle
- Ombres subtiles sur fond sombre

### 3. Interactivité Subtile
- Hover effects discrets (scale, shadow, border)
- Transitions douces (150-500ms)
- Feedback visuel immédiat

### 4. Hiérarchie Visuelle
- Contrastes forts (blanc sur noir)
- Tailles de texte variées
- Espacements cohérents

### 5. Performance
- Animations optimisées GPU
- Respect de prefers-reduced-motion
- Lazy loading des composants lourds

---

## 📱 Responsive Design

### Breakpoints

```css
Mobile: < 768px
  - Padding: px-6
  - Text sizes réduits
  - Cursor: auto (pas de custom cursor)

Tablet: 768px - 1024px
  - Layout adaptatif
  - Text sizes moyens

Desktop: > 1024px
  - Layout complet
  - Text sizes maximum
  - Custom cursor activé
```

### Patterns Responsive

```css
/* Text Responsive */
text-5xl md:text-7xl lg:text-8xl

/* Padding Responsive */
px-6 py-24 md:py-32

/* Grid Responsive */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

## 🎨 Exemples de Combinaisons

### Hero Section

```css
Container: max-w-5xl mx-auto text-center
Badge: inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-6 py-2
Heading: text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[1.1]
Body: text-lg md:text-xl text-slate-400 font-light leading-relaxed
```

### Navigation

```css
Background Scrolled: bg-black/60 backdrop-blur-2xl border-b border-white/[0.08]
Link Active: text-white avec bg-gradient-to-br from-white/[0.08] to-white/[0.03]
Link Hover: text-slate-400 hover:text-white
Button: bg-gradient-to-r from-red-600/90 to-red-500/90
```

### Card avec Hover

```css
Base: backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-12
Hover: hover:border-white/[0.15] hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1
Transition: transition-all duration-500
```

---

## 🚀 Checklist d'Implémentation

Pour appliquer ce design system dans votre projet principal :

- [ ] Configurer la palette de couleurs dans votre système de design
- [ ] Importer la police Inter (Google Fonts)
- [ ] Créer les composants de base (Button, Card, Badge, Input)
- [ ] Implémenter le système de glass morphism
- [ ] Configurer les animations et transitions
- [ ] Adapter les breakpoints responsive
- [ ] Tester l'accessibilité (contrastes, focus states)
- [ ] Optimiser les performances (GPU acceleration, lazy loading)

---

## 📝 Notes Importantes

1. **Accessibilité**: Toujours maintenir un contraste suffisant (WCAG AA minimum)
2. **Performance**: Utiliser `will-change` et `transform: translateZ(0)` pour les animations
3. **Motion**: Respecter `prefers-reduced-motion` pour l'accessibilité
4. **Couleurs**: Les opacités sont cruciales pour l'effet glass morphism
5. **Typography**: La légèreté des fonts (light/extralight) est essentielle au style

---

*Ce document est une extraction du design de la landing page Nucigen Labs. Utilisez-le comme référence pour maintenir la cohérence visuelle dans le projet principal.*

