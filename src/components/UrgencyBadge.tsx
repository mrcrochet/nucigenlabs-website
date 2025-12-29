import { Clock, Users } from 'lucide-react';

interface UrgencyBadgeProps {
  type?: 'spots' | 'time' | 'custom';
  value?: string;
  label?: string;
}

export default function UrgencyBadge({ type = 'spots', value, label }: UrgencyBadgeProps) {
  const getContent = () => {
    if (value && label) {
      return { icon: Clock, text: value, subtext: label };
    }

    switch (type) {
      case 'spots':
        return {
          icon: Users,
          text: 'Limited to 1,200 spots',
          subtext: 'For technical reasons and quality assurance, we\'re limiting early access to 1,200 users'
        };
      case 'time':
        return {
          icon: Clock,
          text: 'Early access',
          subtext: 'Apply before launch on January 30, 2026'
        };
      default:
        return {
          icon: Clock,
          text: 'Limited availability',
          subtext: 'Apply now for priority access'
        };
    }
  };

  const { icon: Icon, text, subtext } = getContent();

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E1463E]/10 border border-[#E1463E]/30 backdrop-blur-sm">
      <Icon size={16} className="text-[#E1463E]" />
      <div>
        <p className="text-sm text-[#E1463E] font-medium">{text}</p>
        <p className="text-xs text-slate-500 font-light">{subtext}</p>
      </div>
    </div>
  );
}

