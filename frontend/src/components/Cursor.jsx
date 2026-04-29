import React, { useEffect } from 'react';

const Cursor = () => {
  useEffect(() => {
    // Outer trailing ring
    const cursorRing = document.createElement('div');
    cursorRing.className = 'fixed left-0 top-0 w-10 h-10 rounded-full border-2 pointer-events-none z-[9998] transition-transform duration-300 ease-out flex items-center justify-center opacity-0';
    cursorRing.style.borderColor = 'var(--fg)';
    
    // Sharp inner dot
    const innerDot = document.createElement('div');
    innerDot.className = 'fixed left-0 top-0 w-1.5 h-1.5 rounded-full pointer-events-none z-[9999] transition-transform duration-75 ease-out opacity-0 shadow-[0_0_10px_rgba(255,255,255,0.8)]';
    innerDot.style.backgroundColor = 'var(--fg)';
    
    document.body.appendChild(cursorRing);
    document.body.appendChild(innerDot);

    let mouseX = 0;
    let mouseY = 0;
    let isHoveringLink = false;
    
    document.body.style.cursor = 'none';

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      cursorRing.style.opacity = '1';
      innerDot.style.opacity = '1';

      cursorRing.style.transform = `translate(${mouseX - 20}px, ${mouseY - 20}px) scale(${isHoveringLink ? 1.5 : 1})`;
      innerDot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px) scale(1)`;

      // Check if hovering over inverted section
      const target = e.target;
      if (target && target.closest && target.closest('.bg-\\[var\\(--fg\\)\\]')) {
         cursorRing.style.borderColor = 'var(--bg)';
         innerDot.style.backgroundColor = 'var(--bg)';
         innerDot.style.boxShadow = 'none'; // remove glow on white
      } else {
         cursorRing.style.borderColor = 'var(--fg)';
         innerDot.style.backgroundColor = 'var(--fg)';
         innerDot.style.boxShadow = '0 0 10px rgba(255,255,255,0.8)';
      }
    };
    
    const handleMouseLeave = () => {
      cursorRing.style.opacity = '0';
      innerDot.style.opacity = '0';
    };
    
    const handleMouseDown = () => {
      cursorRing.style.transform = `translate(${mouseX - 20}px, ${mouseY - 20}px) scale(0.8)`;
    };
    
    const handleMouseUp = () => {
      cursorRing.style.transform = `translate(${mouseX - 20}px, ${mouseY - 20}px) scale(${isHoveringLink ? 1.5 : 1})`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const addHoverListeners = () => {
      document.querySelectorAll('a, button, [role="button"], input, select, textarea').forEach(el => {
        el.addEventListener('mouseenter', () => {
          isHoveringLink = true;
          cursorRing.style.transform = `translate(${mouseX - 20}px, ${mouseY - 20}px) scale(1.5)`;
        });
        el.addEventListener('mouseleave', () => {
          isHoveringLink = false;
          cursorRing.style.transform = `translate(${mouseX - 20}px, ${mouseY - 20}px) scale(1)`;
        });
      });
    };
    
    // Slight delay to ensure elements are rendered
    setTimeout(addHoverListeners, 1000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'auto';
      if (document.body.contains(cursorRing)) document.body.removeChild(cursorRing);
      if (document.body.contains(innerDot)) document.body.removeChild(innerDot);
    };
  }, []);

  return null;
};

export default Cursor;