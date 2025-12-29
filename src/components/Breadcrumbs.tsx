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

  // Build breadcrumbs from path
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const name = segment
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
        className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.08] bg-black/20 backdrop-blur-sm"
        aria-label="Breadcrumb"
      >
        <div className="max-w-7xl mx-auto">
          <ol className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.url} className="flex items-center gap-2">
                  {index === 0 ? (
                    <Link
                      to={crumb.url}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Home"
                    >
                      <Home size={16} className="flex-shrink-0" />
                    </Link>
                  ) : (
                    <>
                      <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
                      {isLast ? (
                        <span className="text-white font-light whitespace-nowrap">{crumb.name}</span>
                      ) : (
                        <Link
                          to={crumb.url}
                          className="text-slate-400 hover:text-white transition-colors font-light whitespace-nowrap min-h-[44px] flex items-center"
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

