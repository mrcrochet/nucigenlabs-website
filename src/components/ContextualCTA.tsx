import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Zap, Shield } from 'lucide-react';

interface ContextualCTAProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'feature';
  size?: 'sm' | 'md' | 'lg';
  icon?: 'arrow' | 'trending' | 'zap' | 'shield';
  children: React.ReactNode;
  to?: string;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export default function ContextualCTA({
  variant = 'primary',
  size = 'md',
  icon = 'arrow',
  children,
  to,
  href,
  className = '',
  onClick
}: ContextualCTAProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-[#E1463E] hover:bg-[#E1463E]/90 text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(225,70,62,0.4)] active:scale-[0.98] focus:ring-[#E1463E]/50',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30',
    outline: 'bg-transparent hover:bg-white/5 text-white border border-white/20 hover:border-white/40',
    feature: 'bg-gradient-to-r from-[#E1463E]/20 to-[#E1463E]/10 hover:from-[#E1463E]/30 hover:to-[#E1463E]/20 text-white border border-[#E1463E]/30 hover:border-[#E1463E]/50'
  };

  const iconMap = {
    arrow: ArrowRight,
    trending: TrendingUp,
    zap: Zap,
    shield: Shield
  };

  const Icon = iconMap[icon];

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  const content = (
    <>
      {children}
      <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes}>
      {content}
    </button>
  );
}

