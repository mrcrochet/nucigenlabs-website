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
    <main className="flex-1 overflow-y-auto w-full">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Responsive grid: 1 col mobile, 12 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6">
          {children}
        </div>
      </div>
    </main>
  );
}
