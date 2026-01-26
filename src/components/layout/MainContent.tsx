/**
 * MainContent - Main content area
 * Max-width: 1280px, centered
 * Grid: 12 columns desktop, 1 column mobile, 24px gaps
 * Mobile-friendly: Responsive grid, reduced padding
 */

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto w-full bg-grain pb-12">
      {/* pb-12 adds padding bottom to account for DashboardSpine */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 pt-2 sm:pt-3 pb-3">
        {/* Responsive grid: 1 col mobile, 12 cols desktop */}
        {/* Reduced gap for more space: gap-3 sm:gap-4 instead of gap-4 sm:gap-6 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
          {children}
        </div>
      </div>
    </main>
  );
}
