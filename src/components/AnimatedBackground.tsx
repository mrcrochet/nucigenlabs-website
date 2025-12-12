export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0A0A0A]"></div>

      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-gradient-to-br from-rose-600/25 via-pink-700/15 to-transparent rounded-full blur-3xl animate-glow-pulse"></div>
        <div className="absolute top-1/3 left-1/3 w-[700px] h-[700px] bg-gradient-to-tl from-orange-600/15 via-red-600/10 to-transparent rounded-full blur-3xl animate-glow-drift"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-br from-slate-700/10 via-slate-800/5 to-transparent rounded-full blur-3xl animate-glow-drift-reverse"></div>
      </div>

      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g className="animate-data-flow">
          <path d="M100,400 Q300,300 500,400 T900,400" stroke="rgba(248,113,113,0.2)" strokeWidth="1.5" fill="none" />
          <circle cx="300" cy="300" r="3" fill="rgba(248,113,113,0.6)">
            <animateMotion dur="10s" repeatCount="indefinite" path="M0,0 Q200,-100 400,0 T800,0" />
          </circle>
        </g>

        <g className="animate-data-flow-slow">
          <path d="M200,500 Q400,450 600,500 T1000,500" stroke="rgba(156,163,175,0.15)" strokeWidth="1" fill="none" />
          <circle cx="400" cy="450" r="2" fill="rgba(156,163,175,0.4)">
            <animateMotion dur="15s" repeatCount="indefinite" path="M0,0 Q200,-50 400,0 T800,0" />
          </circle>
        </g>

        <g className="animate-data-flow-fast">
          <path d="M50,300 L200,280 L350,320 L500,290 L650,310 L800,285" stroke="rgba(251,146,60,0.12)" strokeWidth="1" fill="none" />
          <circle cx="200" cy="280" r="2.5" fill="rgba(251,146,60,0.5)">
            <animateMotion dur="8s" repeatCount="indefinite" path="M0,0 L150,-20 L300,40 L450,10 L600,30 L750,5" />
          </circle>
        </g>

        <circle cx="20%" cy="30%" r="1.5" fill="rgba(248,113,113,0.3)" className="animate-pulse" />
        <circle cx="80%" cy="60%" r="1.5" fill="rgba(156,163,175,0.3)" className="animate-pulse" style={{animationDelay: '1s'}} />
        <circle cx="50%" cy="20%" r="1" fill="rgba(251,146,60,0.3)" className="animate-pulse" style={{animationDelay: '2s'}} />
        <circle cx="70%" cy="80%" r="1" fill="rgba(248,113,113,0.2)" className="animate-pulse" style={{animationDelay: '1.5s'}} />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/60 to-[#0A0A0A]/90"></div>

      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)',
        backgroundSize: '60px 60px'
      }}></div>
    </div>
  );
}
