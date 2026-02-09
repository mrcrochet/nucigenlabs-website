# Exemples de Code Réutilisables

## 🎨 Styles CSS Réutilisables

### Glass Morphism Container
```css
.glass-container {
  backdrop-filter: blur(24px);
  background: linear-gradient(to bottom right, 
    rgba(255, 255, 255, 0.08), 
    rgba(255, 255, 255, 0.02)
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  padding: 3rem;
}

.glass-container:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-4px);
  transition: all 500ms ease;
}
```

### Badge Style
```css
.badge {
  display: inline-block;
  backdrop-filter: blur(24px);
  background: linear-gradient(to bottom right,
    rgba(225, 70, 62, 0.1),
    rgba(225, 70, 62, 0.05)
  );
  border: 1px solid rgba(225, 70, 62, 0.2);
  border-radius: 9999px;
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.15em;
  color: #E1463E;
  text-transform: uppercase;
}
```

### Button Primary
```css
.btn-primary {
  background-color: #E1463E;
  color: white;
  font-weight: 400;
  padding: 1rem 2.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background-color: rgba(225, 70, 62, 0.9);
  transform: scale(1.05);
  box-shadow: 0 0 35px rgba(225, 70, 62, 0.4);
}

.btn-primary:focus {
  outline: none;
  ring: 2px;
  ring-color: #E1463E;
  ring-offset: 2px;
  ring-offset-color: #0A0A0A;
}
```

---

## ⚛️ Composants React (Exemples)

### Glass Card Component
```tsx
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <div
      className={`
        backdrop-blur-xl
        bg-gradient-to-br from-white/[0.05] to-white/[0.02]
        border border-white/[0.08]
        rounded-2xl p-12
        ${hover ? 'hover:border-white/[0.15] hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1' : ''}
        transition-all duration-500
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

### Badge Component
```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Badge({ children, variant = 'primary' }: BadgeProps) {
  const variants = {
    primary: 'from-[#E1463E]/10 to-[#E1463E]/5 border-[#E1463E]/20 text-[#E1463E]',
    secondary: 'from-white/[0.03] to-white/[0.01] border-white/[0.08] text-slate-500',
  };

  return (
    <div
      className={`
        inline-block
        backdrop-blur-xl
        bg-gradient-to-br ${variants[variant]}
        border rounded-full
        px-6 py-2
        text-sm font-light tracking-[0.15em]
      `}
    >
      {children}
    </div>
  );
}
```

### Button Component
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-normal rounded-lg
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `;

  const variants = {
    primary: `
      bg-[#E1463E] hover:bg-[#E1463E]/90 text-white
      hover:scale-105 hover:shadow-[0_0_35px_rgba(225,70,62,0.4)]
      focus:ring-[#E1463E]
    `,
    secondary: `
      border border-white/20 hover:border-white/40 hover:bg-white/[0.05] text-white
      focus:ring-white/50
    `,
    ghost: `
      text-slate-400 hover:text-white hover:bg-white/[0.05]
      focus:ring-white/50
    `,
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
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

---

## 🎬 Animations CSS

### Glow Pulse Animation
```css
@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1) translate(-50%, -50%);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05) translate(-50%, -50%);
  }
}

.animate-glow-pulse {
  animation: glow-pulse 10s ease-in-out infinite;
  will-change: transform, opacity;
  transform: translateZ(0); /* GPU acceleration */
}
```

### Data Flow Animation
```css
@keyframes data-flow {
  0% {
    opacity: 0.3;
    transform: translateX(0);
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.3;
    transform: translateX(100px);
  }
}

.animate-data-flow {
  animation: data-flow 12s ease-in-out infinite;
  will-change: transform, opacity;
}
```

### Shimmer Effect
```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
  overflow: hidden;
  position: relative;
}
```

---

## 📐 Layout Patterns

### Hero Section Layout
```tsx
<section className="relative min-h-screen flex items-center justify-center px-6 py-32">
  <div className="max-w-5xl mx-auto w-full text-center">
    {/* Badge */}
    <Badge>PREDICTIVE NEWS ANALYSIS</Badge>
    
    {/* Heading */}
    <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-10 leading-[1.1] text-white">
      We scan the news.<br />
      We predict the market.<br />
      <span className="text-[#E1463E]">Before it moves.</span>
    </h1>
    
    {/* Body Text */}
    <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-6 max-w-4xl mx-auto">
      Nucigen Labs transforms global news into predictive market signals in real-time.
    </p>
    
    {/* CTA Button */}
    <Button size="lg">Join Early Access</Button>
  </div>
</section>
```

### Card Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <GlassCard key={item.id} hover>
      <h3 className="text-2xl text-slate-100 font-light mb-4">{item.title}</h3>
      <p className="text-sm text-slate-400 font-light leading-[2]">
        {item.description}
      </p>
    </GlassCard>
  ))}
</div>
```

---

## 🎨 Tailwind Config Suggestion

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E1463E',
          hover: 'rgba(225, 70, 62, 0.9)',
          light: 'rgba(225, 70, 62, 0.4)',
        },
        background: {
          DEFAULT: '#0A0A0A',
          overlay: 'rgba(10, 10, 10, 0.8)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        extralight: '200',
        light: '300',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 10s ease-in-out infinite',
        'data-flow': 'data-flow 12s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
}
```

---

## 🔧 Utilitaires CSS

### Text Gradient
```css
.text-gradient-red {
  background: linear-gradient(to right, #E1463E, #F97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Container Max Widths
```css
.container-sm { max-width: 48rem; }  /* max-w-3xl */
.container-md { max-width: 56rem; }  /* max-w-4xl */
.container-lg { max-width: 64rem; }  /* max-w-5xl */
.container-xl { max-width: 72rem; }  /* max-w-6xl */
.container-2xl { max-width: 80rem; } /* max-w-7xl */
```

---

*Utilisez ces exemples comme base pour créer vos propres composants dans le projet principal.*

