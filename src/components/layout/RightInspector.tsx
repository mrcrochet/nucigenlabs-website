/**
 * RightInspector - Right side panel for context/details
 * Width: 360px (optional)
 */

interface RightInspectorProps {
  children: React.ReactNode;
}

export default function RightInspector({ children }: RightInspectorProps) {
  return (
    <aside className="w-[360px] bg-background-overlay backdrop-blur-xl border-l border-borders-subtle overflow-y-auto">
      <div className="p-6">
        {children}
      </div>
    </aside>
  );
}
