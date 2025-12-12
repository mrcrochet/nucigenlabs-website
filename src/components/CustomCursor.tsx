import { useState, useEffect } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        window.getComputedStyle(target).cursor === 'pointer';

      setIsPointer(isClickable);
    };

    const hideCursor = () => setIsHidden(true);
    const showCursor = () => setIsHidden(false);

    window.addEventListener('mousemove', updateCursor);
    document.addEventListener('mouseleave', hideCursor);
    document.addEventListener('mouseenter', showCursor);

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
    };
  }, []);

  if (isHidden) return null;

  return (
    <>
      <div
        className="fixed pointer-events-none z-[9999] mix-blend-difference transition-transform duration-150"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
        }}
      >
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>

      <div
        className="fixed pointer-events-none z-[9998] transition-all duration-500 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 2 : 1})`,
        }}
      >
        <div className={`w-8 h-8 border border-white/30 rounded-full ${isPointer ? 'bg-white/5' : ''}`}></div>
      </div>

      {isPointer && (
        <div
          className="fixed pointer-events-none z-[9997]"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-xl"></div>
        </div>
      )}
    </>
  );
}
