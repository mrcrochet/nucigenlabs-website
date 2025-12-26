import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-normal rounded-md transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-nucigen-bg-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-transparent border border-nucigen-red text-nucigen-red hover:bg-nucigen-red/8 hover:border-nucigen-red focus:ring-nucigen-red',
    secondary: 'bg-transparent border border-nucigen-border-subtle text-nucigen-text-secondary hover:border-nucigen-border hover:bg-white/2 focus:ring-nucigen-border-subtle',
    ghost: 'text-nucigen-text-tertiary hover:text-nucigen-text-secondary hover:bg-white/2 focus:ring-nucigen-border-subtle',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-10 py-4 text-base',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

