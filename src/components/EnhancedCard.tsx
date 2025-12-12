import { ReactNode, useRef, useState } from 'react';

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function EnhancedCard({
  children,
  className = '',
  glowColor = 'rgba(239, 68, 68, 0.3)',
}: EnhancedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateXValue = (mouseY / rect.height) * -10;
    const rotateYValue = (mouseX / rect.width) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);

    const glowX = ((e.clientX - rect.left) / rect.width) * 100;
    const glowY = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPosition({ x: glowX, y: glowY });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      className={`group relative transition-all duration-300 ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-2xl"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, ${glowColor}, transparent 50%)`,
        }}
      ></div>

      <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl group-hover:border-white/[0.15] transition-all duration-300">
        {children}
      </div>

      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(255,255,255,0.05), transparent 40%)`,
        }}
      ></div>
    </div>
  );
}
