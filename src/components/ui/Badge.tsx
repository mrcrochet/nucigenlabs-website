/**
 * Badge Component - Shared UI component for tags and labels
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'sector' | 'region' | 'level' | 'critical' | 'neutral' | 'category';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  // Consistent design tokens with proper contrast
  const variants = {
    default: 'bg-white/[0.05] text-slate-300 border-white/[0.08]',
    sector: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    region: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    level: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    critical: 'bg-[#E1463E]/20 text-[#E1463E] border-[#E1463E]/30',
    neutral: 'bg-white/[0.02] text-slate-400 border-white/[0.08]',
    category: 'bg-green-500/10 text-green-300 border-green-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-light border transition-colors duration-200 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

