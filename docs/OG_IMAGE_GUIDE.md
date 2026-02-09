# OG Image Guide

## 📐 Image Specifications

### Standard OG Image
- **Dimensions**: 1200x630px (1.91:1 ratio)
- **Format**: PNG or JPG
- **File Size**: < 1MB (recommended: < 300KB)
- **Location**: `public/og-image.png`

### Why 1200x630px?
- Facebook/LinkedIn recommended size
- Twitter supports this size
- Optimal for most social platforms
- Good balance between quality and file size

## 🎨 Design Guidelines

### Text Guidelines
- **Title**: Large, bold, readable at small sizes
- **Description**: Keep it short (2-3 lines max)
- **Font Size**: Minimum 60px for title, 40px for description
- **Contrast**: High contrast for readability

### Brand Guidelines
- Use Nucigen Labs brand colors (black background, red accents)
- Include logo if space allows
- Maintain professional, institutional look

## 📝 Current Implementation

The site automatically handles OG images through:
1. **Default**: `public/og-image.png` (set in `index.html`)
2. **Per-page**: Can be customized via `<SEO image="/custom-image.png" />`
3. **Component**: `src/components/OGImage.tsx` handles meta tags

## 🛠️ Creating OG Images

### Option 1: Design Tool (Figma, Canva, etc.)
1. Create 1200x630px canvas
2. Add background (black #0A0A0A)
3. Add title and description
4. Export as PNG
5. Optimize with TinyPNG or similar
6. Save to `public/og-image.png`

### Option 2: Programmatic Generation
Consider using libraries like:
- `@vercel/og` (for Next.js)
- `sharp` + `canvas` (Node.js)
- Or create a simple script

## 📋 Per-Page OG Images

To add custom OG images for specific pages:

```tsx
// In your page component
<SEO 
  title="Page Title"
  description="Page description"
  image="/custom-og-image.png" // Custom image
/>
```

## ✅ Checklist

- [ ] Create main OG image (1200x630px)
- [ ] Optimize file size (< 300KB)
- [ ] Test on Facebook Debugger
- [ ] Test on Twitter Card Validator
- [ ] Create custom images for key pages (optional)
- [ ] Add alt text for accessibility

## 🔗 Testing Tools

- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
- **OG Image Preview**: https://www.opengraph.xyz/


