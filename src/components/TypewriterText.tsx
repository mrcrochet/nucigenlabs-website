import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  texts: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export default function TypewriterText({ 
  texts, 
  className = '',
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000
}: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextCharDelay, setNextCharDelay] = useState(0);

  // Calculate human-like typing speed based on character
  const getHumanTypingSpeed = (char: string, baseSpeed: number): number => {
    // Spaces are typed faster
    if (char === ' ') {
      return baseSpeed * 0.3 + Math.random() * baseSpeed * 0.2;
    }
    
    // Punctuation causes longer pauses (human thinking)
    if (char === '.' || char === ',' || char === '—' || char === ':' || char === ';') {
      return baseSpeed * 2 + Math.random() * baseSpeed * 1.5;
    }
    
    // After punctuation, longer pause
    const prevChar = displayedText[displayedText.length - 1];
    if (prevChar === '.' || prevChar === ',' || prevChar === '—') {
      return baseSpeed * 1.5 + Math.random() * baseSpeed;
    }
    
    // Random variation for natural feel (±30%)
    const variation = 0.7 + Math.random() * 0.6;
    
    // Occasionally add a longer pause (human hesitation)
    if (Math.random() < 0.15) {
      return baseSpeed * variation * 2.5;
    }
    
    return baseSpeed * variation;
  };

  useEffect(() => {
    if (isPaused) return;

    const currentText = texts[currentTextIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayedText.length < currentText.length) {
          const nextChar = currentText[displayedText.length];
          const speed = getHumanTypingSpeed(nextChar, typingSpeed);
          
          setDisplayedText(currentText.slice(0, displayedText.length + 1));
          setNextCharDelay(speed);
          
          // Occasionally pause mid-sentence (human thinking)
          if (Math.random() < 0.08 && displayedText.length > 10) {
            setIsPaused(true);
            setTimeout(() => {
              setIsPaused(false);
            }, 300 + Math.random() * 500);
          }
        } else {
          // Finished typing, pause then start deleting
          setIsPaused(true);
          setTimeout(() => {
            setIsPaused(false);
            setIsDeleting(true);
          }, pauseDuration + Math.random() * 1000);
        }
      } else {
        // Deleting - faster and more consistent
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
          setNextCharDelay(deletingSpeed + Math.random() * deletingSpeed * 0.3);
        } else {
          // Finished deleting, pause before next text
          setIsPaused(true);
          setTimeout(() => {
            setIsPaused(false);
            setIsDeleting(false);
            setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          }, 500 + Math.random() * 500);
        }
      }
    }, nextCharDelay || (isDeleting ? deletingSpeed : typingSpeed));

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, isPaused, currentTextIndex, texts, typingSpeed, deletingSpeed, pauseDuration, nextCharDelay]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

