import { useEffect } from 'react';

interface OGImageProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function OGImage({ 
  title, 
  description = 'Strategic intelligence platform that predicts market movements before they happen.',
  image = '/og-image.png',
  url = 'https://nucigenlabs.com'
}: OGImageProps) {
  useEffect(() => {
    // Update OG image meta tags
    const updateMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const fullImageUrl = image.startsWith('http') ? image : `https://nucigenlabs.com${image}`;
    
    updateMetaTag('og:image', fullImageUrl);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:type', 'image/png');
    updateMetaTag('og:image:alt', title);
    
    // Twitter card image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', fullImageUrl);
  }, [title, description, image, url]);

  return null;
}

