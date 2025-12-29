# SEO Optimization Guide

## ✅ Implemented Optimizations

### 1. Schema.org Structured Data
- **Organization**: Company information
- **Product**: Pricing and product details
- **FAQ**: FAQ structured data for Partner Program
- **WebSite**: Site-wide structured data
- **BreadcrumbList**: Navigation breadcrumbs

### 2. Dynamic Sitemap Generation
- **Plugin Vite**: Automatically generates `sitemap.xml` on build
- **Location**: `public/sitemap.xml`
- **Update**: Edit `src/utils/generateSitemap.ts` to add/remove routes

### 3. Breadcrumbs
- **Component**: `src/components/Breadcrumbs.tsx`
- **Auto-generated**: From current route
- **Structured Data**: Includes BreadcrumbList schema
- **Display**: Shows on all pages except homepage

### 4. OG Images Optimization
- **Component**: `src/components/OGImage.tsx`
- **Dimensions**: 1200x630px (recommended)
- **Meta Tags**: Full OG image tags with dimensions
- **Twitter Card**: Optimized for Twitter sharing

### 5. Meta Descriptions
- **All Pages**: Optimized descriptions with keywords
- **Dynamic**: Per-page descriptions
- **Keywords**: Relevant keywords for each page

### 6. robots.txt
- **Optimized**: Allow/disallow rules
- **Sitemap**: Reference to sitemap.xml
- **Location**: `public/robots.txt`

### 7. humans.txt
- **Created**: `public/humans.txt`
- **Content**: Team info, technologies, standards

## 📝 How to Update Sitemap

Edit `src/utils/generateSitemap.ts`:

```typescript
export const siteRoutes: SitemapUrl[] = [
  {
    loc: 'https://nucigenlabs.com/your-new-page',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8,
  },
  // ... other routes
];
```

The sitemap will be automatically regenerated on each build.

## 🖼️ OG Images

To add custom OG images per page:

```tsx
<SEO 
  title="Page Title"
  description="Page description"
  image="/custom-og-image.png" // Custom image path
/>
```

**Recommended OG Image Specs:**
- Size: 1200x630px
- Format: PNG or JPG
- File size: < 1MB
- Location: `public/og-image.png` (or custom path)

## 🔍 Testing SEO

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
4. **Schema Markup Validator**: https://validator.schema.org/

## 📊 Next Steps

1. Create actual OG images (1200x630px) for each page
2. Submit sitemap to Google Search Console
3. Monitor search performance
4. Add more structured data as needed

