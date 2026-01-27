/**
 * MainContent - Main content area
 * Max-width: 1280px, centered
 * Grid: 12 columns desktop, 1 column mobile, minimal gaps
 * Mobile-friendly: Responsive grid, minimal padding
 * 
 * Palantir-style: Content starts immediately after TopNav, no hero spacing
 * Institutional density: gap-x for breathing, gap-y for density
 */

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto w-full bg-grain min-h-0 self-start">
      {/* Content container - padding bottom moved here (not on main) */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 pt-1 pb-8 w-full">
        {/* Dense operational grid - horizontal breathing, vertical density */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-2 gap-y-1">
          {children}
        </div>
      </div>
    </main>
  );
}
