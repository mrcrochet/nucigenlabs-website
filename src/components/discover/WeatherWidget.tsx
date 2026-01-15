/**
 * WeatherWidget Component
 * 
 * Displays current weather and 5-day forecast
 * Similar to Perplexity's weather widget
 */

import { CloudSnow, Cloud, Sun, CloudRain } from 'lucide-react';

interface WeatherWidgetProps {
  location?: string;
}

export default function WeatherWidget({ location = 'Ville-Marie' }: WeatherWidgetProps) {
  // Mock data - in production, fetch from weather API
  const currentWeather = {
    temp: -7,
    condition: 'Light snow',
    high: -4,
    low: -14,
  };

  const forecast = [
    { day: 'Thu', icon: 'snow', temp: -4 },
    { day: 'Fri', icon: 'snow', temp: -12 },
    { day: 'Sat', icon: 'snow', temp: -2 },
    { day: 'Sun', icon: 'snow', temp: -2 },
    { day: 'Mon', icon: 'snow', temp: -3 },
  ];

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'snow':
        return <CloudSnow className="w-4 h-4" />;
      case 'rain':
        return <CloudRain className="w-4 h-4" />;
      case 'sun':
        return <Sun className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-2xl font-light text-white">
            {currentWeather.temp}° <span className="text-sm text-slate-400">F/C</span>
          </div>
          <div className="text-sm text-slate-400 font-light">{currentWeather.condition}</div>
        </div>
        <CloudSnow className="w-8 h-8 text-slate-400" />
      </div>
      
      <div className="text-xs text-slate-500 font-light mb-3">{location}</div>
      <div className="text-xs text-slate-500 font-light mb-4">
        H: {currentWeather.high}° L: {currentWeather.low}°
      </div>

      {/* 5-day forecast */}
      <div className="flex items-center justify-between gap-2">
        {forecast.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className="text-[10px] text-slate-500 font-light">{day.day}</div>
            <div className="text-slate-400">{getWeatherIcon(day.icon)}</div>
            <div className="text-xs text-slate-400 font-light">{day.temp}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
