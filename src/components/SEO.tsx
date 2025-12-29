import { useEffect } from 'react';
import StructuredData from './StructuredData';
import OGImage from './OGImage';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  faqItems?: Array<{ question: string; answer: string }>;
}

export default function SEO({
  title = 'Nucigen Labs — Strategic Intelligence for Operators',
  description = 'We don\'t predict markets. We predict consequences. Access to geopolitical and industrial intelligence before markets reprice.',
  image = 'https://nucigenlabs.com/og-image.png',
  url = 'https://nucigenlabs.com',
  keywords = 'market intelligence, predictive analytics, geopolitical analysis, financial forecasting, strategic intelligence, market prediction, real-time intelligence',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  faqItems,
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: 'Nucigen Labs' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:site', content: '@nucigenlabs' },
      { name: 'twitter:creator', content: '@nucigenlabs' },
      // OG Image dimensions
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:alt', content: title },
    ];

    // Add article-specific meta tags
    if (type === 'article' && publishedTime) {
      metaTags.push(
        { property: 'article:published_time', content: publishedTime },
        { property: 'article:author', content: author || 'Nucigen Labs' }
      );
      if (modifiedTime) {
        metaTags.push({ property: 'article:modified_time', content: modifiedTime });
      }
    }

    metaTags.forEach(({ name, property, content }) => {
      if (!content) return;
      
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);

      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    });

    // Add canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, image, url, keywords, type, publishedTime, modifiedTime, author]);

  return (
    <>
      <OGImage title={title} description={description} image={image} url={url} />
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />
      {faqItems && faqItems.length > 0 && (
        <StructuredData type="FAQ" faqItems={faqItems} />
      )}
    </>
  );
}
