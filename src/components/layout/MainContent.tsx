/**
 * MainContent - Main content area
 * Max-width: 1280px, centered
 * Grid: 12 columns, 24px gaps
 */

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        {/* 12-column grid container */}
        <div className="grid grid-cols-12 gap-6">
          {children}
        </div>
      </div>
    </main>
  );
}
