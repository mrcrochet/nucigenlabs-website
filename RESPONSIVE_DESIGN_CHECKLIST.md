# Responsive Design Checklist

## 📱 Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## ✅ Tests à Effectuer

### Mobile (< 768px)

#### Navigation
- [ ] Sidebar se transforme en menu hamburger
- [ ] Menu mobile s'ouvre/ferme correctement
- [ ] Overlay fonctionne au clic
- [ ] Navigation accessible au clavier

#### Pages Principales
- [ ] Intelligence Feed : Cards empilées verticalement
- [ ] Events : Liste verticale, filtres compacts
- [ ] Dashboard : Stats en colonne unique
- [ ] Research : Input de recherche full-width

#### Typography
- [ ] Titres adaptés (text-3xl max sur mobile)
- [ ] Texte lisible (min 14px)
- [ ] Line-height confortable (1.7)

#### Touch Targets
- [ ] Boutons min 44x44px
- [ ] Espacement entre éléments cliquables
- [ ] Pas de hover states qui bloquent

#### Spacing
- [ ] Padding réduit sur mobile (px-4)
- [ ] Marges cohérentes
- [ ] Pas de débordement horizontal

### Tablet (768px - 1024px)

#### Layout
- [ ] Sidebar visible ou accessible
- [ ] Grids 2 colonnes fonctionnent
- [ ] Cards bien espacées

#### Typography
- [ ] Tailles intermédiaires
- [ ] Lisible sans zoom

### Desktop (> 1024px)

#### Layout
- [ ] Sidebar fixe visible
- [ ] Contenu max-width centré
- [ ] Espacement optimal

#### Interactions
- [ ] Hover states fonctionnent
- [ ] Animations fluides
- [ ] Focus states visibles

## 🎨 Cohérence Visuelle

### Couleurs
- [ ] Primary (#E1463E) utilisé de manière cohérente
- [ ] Background (#0A0A0A) uniforme
- [ ] Text colors (white, slate-400, slate-500) cohérents
- [ ] Borders (white/[0.08]) uniformes

### Espacements
- [ ] Padding pages : px-4 sm:px-6 lg:px-10
- [ ] Padding sections : py-6 sm:py-8 lg:py-12
- [ ] Gaps entre éléments : gap-4 sm:gap-6

### Border Radius
- [ ] Cards : rounded-xl (1rem)
- [ ] Badges : rounded-lg (0.5rem)
- [ ] Buttons : rounded-lg (0.5rem)

### Shadows
- [ ] Glow effects cohérents
- [ ] Glass morphism uniforme

## 🧪 Tests Manuels

### Mobile (iPhone SE, iPhone 12, Android)
1. Ouvrir chaque page principale
2. Tester navigation
3. Tester interactions (clic, scroll)
4. Vérifier lisibilité
5. Tester formulaires

### Tablet (iPad, iPad Pro)
1. Vérifier layout 2 colonnes
2. Tester sidebar
3. Vérifier espacements

### Desktop (1920x1080, 2560x1440)
1. Vérifier max-width
2. Tester hover states
3. Vérifier animations

## 🔧 Outils de Test

### Chrome DevTools
- Device Toolbar (Cmd+Shift+M)
- Responsive mode
- Throttling réseau

### Tests Réels
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)
- Desktop (Chrome, Firefox, Safari)

## 📝 Notes

- Utiliser `container-md` pour largeurs cohérentes
- Utiliser `padding-page` pour espacements
- Toujours tester en mode portrait ET paysage
- Vérifier le scroll horizontal (ne devrait pas exister)
