# Fin-Inspired Design System for Nucigen Labs

## 🎨 Color Palette (Nucigen Colors Preserved)

### Backgrounds
- **Primary Background**: `#0B0F14` (deep blue-black, infrastructure-grade)
- **Secondary Surface**: `#0F1623` (cards, panels)
- **Tertiary Surface**: `#141B2D` (hover, focus states)

### Text Colors
- **Primary Text**: `#F4F6F8` (titles, headings)
- **Secondary Text**: `#C9D1E1` (body text)
- **Tertiary Text**: `#8B93A7` (metadata, labels)

### Accent (Nucigen Red - Preserved)
- **Primary Accent**: `#E1463E` (signals, CTAs, highlights)
- **Border Accent**: `rgba(225, 70, 62, 0.08)` (hover states)

### Borders
- **Primary Border**: `#1F2937`
- **Subtle Border**: `#2A324A`

## ✍️ Typography

### Headings (Serif - Playfair Display)
- **H1**: `clamp(3.5rem, 8vw, 4.5rem)` - font-weight: 500
- **H2**: `clamp(2.5rem, 6vw, 3rem)` - font-weight: 500
- **H3**: `clamp(1.75rem, 4vw, 2rem)` - font-weight: 500
- Letter-spacing: `-0.02em`
- Line-height: `1.1-1.3`

### Body Text (Sans-serif - Inter)
- **Body**: `16-18px` - font-weight: 400
- **Small**: `13-14px` - font-weight: 400
- Line-height: `1.6+`

## 📐 Spacing System

### Section Spacing
- **Vertical**: `120px` (standard), `160px` (large)
- **Horizontal**: `64px` (standard), `96px` (large)

### Component Spacing
- **Card Padding**: `32px` (vertical and horizontal)
- **Card Gap**: `24-32px`
- **Button Padding**: `12px 24px`

## 🧩 Components

### Buttons

**Primary Button**:
```css
.btn-primary {
  background: transparent;
  border: 1px solid #E1463E;
  color: #E1463E;
  padding: 12px 24px;
  border-radius: 6px;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: rgba(225, 70, 62, 0.08);
}
```

**Secondary Button**:
```css
.btn-secondary {
  background: transparent;
  border: 1px solid #2A324A;
  color: #C9D1E1;
  padding: 12px 24px;
  border-radius: 6px;
  transition: all 150ms ease-out;
}
```

### Cards

**Infrastructure Card**:
```css
.card-infrastructure {
  background: #0F1623;
  border: 1px solid #1F2937;
  border-radius: 10px;
  padding: 32px;
  transition: all 200ms ease-out;
}

.card-infrastructure:hover {
  border-color: #2A324A;
}
```

### Tags/Badges

```css
.tag-badge {
  background: rgba(255, 255, 255, 0.04);
  color: #8B93A7;
  border: 1px solid #1F2937;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
}
```

## 🎯 Design Principles

1. **Infrastructure-grade**: The interface should feel authoritative and technical
2. **Single accent color**: Only use Nucigen red (#E1463E) for signals and CTAs
3. **Generous spacing**: White space signals seriousness and credibility
4. **Sober components**: Minimal glass morphism, subtle borders, industrial feel
5. **Vertical layout**: Slow reading, document-like structure
6. **No playful elements**: Everything should feel professional and serious

## 📝 Usage Examples

### Section Structure
```tsx
<section className="px-section-h py-section-v">
  <div className="max-w-5xl mx-auto">
    <h1 className="mb-12">Title</h1>
    <p className="text-nucigen-text-secondary mb-8">Description</p>
  </div>
</section>
```

### Card Usage
```tsx
<div className="card-infrastructure">
  <h3 className="text-nucigen-text-primary mb-4">Card Title</h3>
  <p className="text-nucigen-text-secondary">Card content</p>
</div>
```

### Button Usage
```tsx
<button className="btn-primary">
  Action
</button>
```

## 🚫 What to Avoid

- ❌ Filled background buttons (use borders only)
- ❌ Excessive glass morphism
- ❌ Playful animations
- ❌ Multiple accent colors
- ❌ Centered everything (align left)
- ❌ Tight spacing
- ❌ Light font weights for headings (use 500+)

