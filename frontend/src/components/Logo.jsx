import React, { useState, useEffect, useRef } from 'react';

// Get brightness from RGB/RGBA string
const getLuminance = (rgbString) => {
  const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 0;
  const [_, r, g, b] = match;
  // standard relative luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

// Custom hook to detect luminance under a specific element on scroll
export const useLuminanceScanner = (ref) => {
  const [isLightBg, setIsLightBg] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      // Sample center of the logo
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Get elements at this point, filter out the logo itself or header wrapper
      const elements = document.elementsFromPoint(x, y);
      const bgElement = elements.find(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      });

      if (bgElement) {
        const bgColors = window.getComputedStyle(bgElement).backgroundColor;
        const luminance = getLuminance(bgColors);
        setIsLightBg(luminance > 0.5); // > 0.5 means it's a light background
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return isLightBg;
};

export const Logo = ({ className = "h-8 md:h-10", overrideTheme = null }) => {
  const logoRef = useRef(null);
  const isLightBg = useLuminanceScanner(logoRef);
  
  // If overrideTheme is provided (e.g. from Dashboard), use it. Otherwise use scanner.
  const useBlackLogo = overrideTheme ? overrideTheme === 'light' : isLightBg;

  return (
    <img 
      ref={logoRef}
      src={useBlackLogo ? "/black-logo.png" : "/white-logo.png"} 
      alt="Rapid Route Logo" 
      className={`${className} transition-opacity duration-300`}
      style={{ filter: useBlackLogo ? 'none' : 'drop-shadow(0px 2px 10px rgba(0,0,0,0.5))' }}
    />
  );
};

export default Logo;
