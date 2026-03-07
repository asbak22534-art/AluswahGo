import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ThemeConfig } from '../types';

export const Slideshow = ({ images, t }: { images: string[], t: ThemeConfig }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const indicatorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, images.length]);

  useEffect(() => {
    if (indicatorContainerRef.current) {
      const activeIndicator = indicatorContainerRef.current.children[currentIndex] as HTMLElement;
      if (activeIndicator) {
        activeIndicator.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
    setIsPaused(false);
    const swipe = offset.x;
    if (swipe < -50) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    } else if (swipe > 50) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const variants = {
    enter: { opacity: 0, scale: 1.05 },
    center: { opacity: 1, scale: 1, zIndex: 1 },
    exit: { opacity: 0, scale: 1, zIndex: 0 }
  };

  return (
    <div 
      className="relative w-full h-48 sm:h-64 bg-gray-900 overflow-hidden shrink-0 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.05}
          onDragStart={() => setIsPaused(true)}
          onDragEnd={handleDragEnd}
          draggable={false}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-5 pointer-events-none z-10">
        <div className="flex flex-col gap-3 w-full">
          <div 
            ref={indicatorContainerRef}
            className="flex gap-1.5 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pointer-events-auto pb-1"
          >
            {images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 shrink-0 ${idx === currentIndex ? `w-6 ${t.primaryBg}` : 'w-1.5 bg-white/50 hover:bg-white'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
