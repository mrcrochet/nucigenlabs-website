import { useState, useEffect } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Don't show custom cursor if user prefers reduced motion or doesn't have a mouse
    if (prefersReducedMotion) return;
    
    // Hide default cursor
    document.body.style.cursor = 'none';
    
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
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
    };
  }, [prefersReducedMotion]);

  if (isHidden || prefersReducedMotion) return null;

  return (
    <>
      {/* Outer hologram ring with glow */}
      <div
        className="fixed pointer-events-none z-[9999] transition-all duration-300 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.4 : 1})`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <div className="relative w-14 h-14">
          {/* Outer ring with hologram glow */}
          <div className="absolute inset-0 rounded-full border-2 border-[#E1463E]/70 shadow-[0_0_25px_rgba(225,70,62,0.5),0_0_50px_rgba(225,70,62,0.2)]"></div>
          
          {/* Animated pulsing inner ring */}
          <div className="absolute inset-1.5 rounded-full border border-[#E1463E]/50 animate-pulse"></div>
          
          {/* Hologram scan lines effect - diagonal sweep */}
          <div 
            className="absolute inset-0 rounded-full overflow-hidden animate-hologram-scan"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(225,70,62,0.3) 30%, rgba(225,70,62,0.5) 50%, rgba(225,70,62,0.3) 70%, transparent 100%)',
            }}
          ></div>
          
          {/* Additional hologram reflection lines */}
          <div 
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(225,70,62,0.1) 2px, rgba(225,70,62,0.1) 4px)',
              opacity: 0.5,
            }}
          ></div>
        </div>
      </div>

      {/* Inner core with hologram pattern */}
      <div
        className="fixed pointer-events-none z-[9998] transition-all duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.3 : 1})`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <div className="relative w-7 h-7">
          {/* Core circle with hologram gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E1463E]/40 via-[#E1463E]/20 to-transparent"></div>
          
          {/* Hologram grid pattern overlay */}
          <div 
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(0deg, rgba(225,70,62,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(225,70,62,0.15) 1px, transparent 1px),
                linear-gradient(45deg, rgba(225,70,62,0.1) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(225,70,62,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '3px 3px, 3px 3px, 6px 6px, 6px 6px',
            }}
          ></div>
          
          {/* Center dot with intense glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#E1463E] shadow-[0_0_10px_rgba(225,70,62,1),0_0_20px_rgba(225,70,62,0.6)] animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Hologram glow effect on hover - enhanced */}
      {isPointer && (
        <>
          <div
            className="fixed pointer-events-none z-[9997] transition-opacity duration-300"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
            aria-hidden="true"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-radial from-[#E1463E]/25 via-[#E1463E]/15 to-transparent blur-2xl"></div>
          </div>
          {/* Additional outer glow ring on hover */}
          <div
            className="fixed pointer-events-none z-[9996] transition-opacity duration-300"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
            aria-hidden="true"
          >
            <div className="w-32 h-32 rounded-full border border-[#E1463E]/20 shadow-[0_0_40px_rgba(225,70,62,0.3)] animate-pulse"></div>
          </div>
        </>
      )}

    </>
  );
}
