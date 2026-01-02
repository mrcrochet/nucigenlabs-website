import { useEffect } from 'react';

interface StructuredDataProps {
  type?: 'Organization' | 'Product' | 'FAQ' | 'WebSite' | 'BreadcrumbList';
  data?: any;
  faqItems?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export default function StructuredData({ 
  type = 'Organization', 
  data,
  faqItems,
  breadcrumbs 
}: StructuredDataProps) {
  useEffect(() => {
    let structuredData: any = {};

    switch (type) {
      case 'Organization':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Nucigen Labs',
          url: 'https://nucigenlabs.com',
          logo: 'https://nucigenlabs.com/favicon.svg',
          description: 'Strategic intelligence platform that transforms global news into predictive market signals in real-time.',
          foundingDate: '2024',
          sameAs: [
            // Add social media links when available
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'contact@nucigenlabs.com',
          },
          ...data
        };
        break;

      case 'Product':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Nucigen Labs',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '59',
            priceCurrency: 'USD',
            priceValidUntil: '2026-12-31',
            availability: 'https://schema.org/PreOrder',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '127',
          },
          description: 'Real-time market intelligence platform that predicts market movements before they happen.',
          ...data
        };
        break;

      case 'FAQ':
        if (faqItems && faqItems.length > 0) {
          structuredData = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
              }
            }))
          };
        }
        break;

      case 'WebSite':
        structuredData = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Nucigen Labs',
          url: 'https://nucigenlabs.com',
          description: 'Strategic intelligence platform for market prediction and analysis.',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://nucigenlabs.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          },
          ...data
        };
        break;

      case 'BreadcrumbList':
        if (breadcrumbs && breadcrumbs.length > 0) {
          structuredData = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url
            }))
          };
        }
        break;
    }

    if (Object.keys(structuredData).length > 0) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = `structured-data-${type.toLowerCase()}`;
      script.text = JSON.stringify(structuredData);
      
      // Remove existing script if present
      const existing = document.getElementById(script.id);
      if (existing) {
        existing.remove();
      }
      
      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById(`structured-data-${type.toLowerCase()}`);
      if (script) {
        script.remove();
      }
    };
  }, [type, data, faqItems, breadcrumbs]);

  return null;
}


