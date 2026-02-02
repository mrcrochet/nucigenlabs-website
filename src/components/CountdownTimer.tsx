import { useState, useEffect } from 'react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2026-02-28T15:00:00Z'); // 28 février 2026 à 15:00 UTC

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        // If countdown is over, set all to 0
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
      }
    };

    // Update immediately
    updateTimer();
    // Then update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3">
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
          {timeLeft.days.toString().padStart(2, '0')}
        </div>
        <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">DAYS</div>
      </div>

      <div className="text-2xl md:text-3xl text-slate-600 font-extralight pb-3">|</div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">HOURS</div>
      </div>

      <div className="text-2xl md:text-3xl text-slate-600 font-extralight pb-3">|</div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">MINUTES</div>
      </div>

      <div className="text-2xl md:text-3xl text-slate-600 font-extralight pb-3">|</div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">SECONDS</div>
      </div>
    </div>
  );
}
