# Quick Reference - Design Tokens

## 🎨 Couleurs Essentielles

```css
/* Couleur primaire */
--color-primary: #E1463E;
--color-primary-hover: rgba(225, 70, 62, 0.9);
--color-bg: #0A0A0A;

/* Texte */
--color-text-primary: #FFFFFF;
--color-text-secondary: rgba(148, 163, 184, 1);
--color-text-muted: rgba(100, 116, 139, 1);
```

## ✍️ Typographie

```css
font-family: 'Inter', system-ui, sans-serif;
font-weight: 300 (light) ou 400 (normal);
letter-spacing: 0.15em à 0.25em pour les labels;
```

## 🎭 Glass Morphism Pattern

```css
backdrop-blur-xl;
bg-gradient-to-br from-white/[0.08] to-white/[0.02];
border border-white/[0.15];
rounded-2xl;
```

## 🎬 Animations Standards

```css
/* Hover */
transition-all duration-300;
hover:scale-105;
hover:shadow-[0_0_35px_rgba(225,70,62,0.4)];

/* Focus */
focus:outline-none;
focus:ring-2 focus:ring-[#E1463E] focus:ring-offset-2;
```

## 📐 Espacements Clés

```css
/* Sections */
py-24 (vertical)
px-6 (horizontal)

/* Containers */
max-w-5xl (largeur principale)
max-w-7xl (navigation)
```

## 🧩 Composants Rapides

### Badge
```css
inline-block backdrop-blur-xl 
bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 
border border-[#E1463E]/20 
rounded-full px-6 py-2
```

### Button Primary
```css
bg-[#E1463E] hover:bg-[#E1463E]/90 
text-white font-normal 
px-10 py-4 rounded-lg
hover:scale-105
```

### Card
```css
backdrop-blur-xl 
bg-gradient-to-br from-white/[0.05] to-white/[0.02] 
border border-white/[0.08] 
rounded-2xl p-12
```

---

*Copiez-collez ces patterns dans votre projet principal pour maintenir la cohérence visuelle.*

