/**
 * ReadingProgress Component
 * 
 * Tracks reading progress and time spent on an item
 */

import { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface ReadingProgressProps {
  itemId: string;
  content: string;
  userId?: string;
  onProgressUpdate?: (progress: number, timeSpent: number) => void;
}

export default function ReadingProgress({
  itemId,
  content,
  userId,
  onProgressUpdate,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate estimated reading time
  useEffect(() => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    setReadingTime(minutes);
  }, [content]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('[data-reading-container]') || window;
      const scrollTop = scrollContainer === window 
        ? window.scrollY 
        : (scrollContainer as HTMLElement).scrollTop;
      const scrollHeight = scrollContainer === window
        ? document.documentElement.scrollHeight - window.innerHeight
        : (scrollContainer as HTMLElement).scrollHeight - (scrollContainer as HTMLElement).clientHeight;
      
      const newProgress = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0;
      setProgress(newProgress);
    };

    const scrollContainer = document.querySelector('[data-reading-container]') || window;
    scrollContainer.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Track time spent
  useEffect(() => {
    startTimeRef.current = Date.now();

    // Update time spent every second
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeSpent(elapsed);
        
        // Track engagement every 10 seconds
        if (elapsed > 0 && elapsed % 10 === 0 && userId) {
          fetch(`/api/discover/${itemId}/engage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              type: 'read_time',
              metadata: { read_time: elapsed },
            }),
          }).catch(err => console.warn('[ReadingProgress] Failed to track read time:', err));
        }
      }
    }, 1000);

    // Update progress periodically
    progressIntervalRef.current = setInterval(() => {
      if (onProgressUpdate) {
        onProgressUpdate(progress, timeSpent);
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Final tracking when component unmounts
      if (startTimeRef.current && userId && timeSpent > 5) {
        fetch(`/api/discover/${itemId}/engage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'read_time',
            metadata: { read_time: timeSpent },
          }),
        }).catch(err => console.warn('[ReadingProgress] Failed to track final read time:', err));
      }
    };
  }, [itemId, userId, progress, timeSpent, onProgressUpdate]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#E1463E] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time Info */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>
            {timeSpent > 0 ? formatTime(timeSpent) : `${readingTime} min read`}
          </span>
        </div>
        {progress > 0 && (
          <span>{progress}% read</span>
        )}
      </div>
    </div>
  );
}
