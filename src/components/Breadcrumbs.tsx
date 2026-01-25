import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import StructuredData from './StructuredData';

interface BreadcrumbItem {
  name: string;
  url: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname;

  // Don't show breadcrumbs on homepage
  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', url: '/' },
  ];

  // Map route segments to friendly names
  const routeNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'intelligence': 'Intelligence',
    'events': 'Events',
    'alerts': 'Alerts',
    'research': 'Research',
    'recommendations': 'Recommendations',
    'profile': 'Profile',
    'settings': 'Settings',
    'quality': 'Quality',
    'onboarding': 'Onboarding',
    'login': 'Login',
    'register': 'Register',
    'pricing': 'Pricing',
    'partners': 'Partners',
    'about': 'About',
    'terms': 'Terms',
    'privacy': 'Privacy',
    'faq': 'FAQ',
    'corporate-impact': 'Corporate Impact',
    'events-feed': 'Events',
    'signals-feed': 'Signals',
    'discover': 'Discover',
    'search': 'Search',
    'overview': 'Overview',
    'impacts': 'Impacts',
  };

  // Build breadcrumbs from path
  let currentPath = '';
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    // Use friendly name if available, otherwise format the segment
    const name = routeNames[segment] || segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      name: name,
      url: currentPath,
    });
  });

  return (
    <>
      <StructuredData type="BreadcrumbList" breadcrumbs={breadcrumbs} />
      <nav 
        className="px-4 sm:px-6 py-3 sm:py-4 border-b border-borders-subtle bg-background-overlay/50 backdrop-blur-sm"
        aria-label="Breadcrumb"
      >
        <div className="max-w-[1280px] mx-auto">
          <ol className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto scrollbar-hide">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.url} className="flex items-center gap-2 flex-shrink-0">
                  {index === 0 ? (
                    <Link
                      to={crumb.url}
                      className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                      aria-label="Home"
                    >
                      <Home size={16} className="flex-shrink-0" />
                    </Link>
                  ) : (
                    <>
                      <ChevronRight size={14} className="text-text-tertiary flex-shrink-0" />
                      {isLast ? (
                        <span className="text-text-primary font-light whitespace-nowrap flex-shrink-0">{crumb.name}</span>
                      ) : (
                        <Link
                          to={crumb.url}
                          className="text-text-secondary hover:text-text-primary transition-colors font-light whitespace-nowrap min-h-[44px] flex items-center flex-shrink-0"
                        >
                          {crumb.name}
                        </Link>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}

