import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/95 text-gray-700 border border-gray-200/85 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-xl transform hover:-translate-y-1 active:scale-95 flex items-center justify-center ${
        isVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
      }`}
      aria-label="Yukarı Çık"
    >
      <ChevronUp className="h-5 w-5 stroke-[2.5]" />
    </button>
  );
}
