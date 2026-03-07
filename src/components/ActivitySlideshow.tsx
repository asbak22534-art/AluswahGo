import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ThemeConfig } from '../types';
import { useData } from '../context/DataContext';

export function ActivitySlideshow({ t }: { t: ThemeConfig }) {
  const { data, isLoading } = useData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const indicatorContainerRef = useRef<HTMLDivElement>(null);

  const activities = data?.galeri?.length ? data.galeri : Array.from({ length: 5 }).map((_, i) => ({
    nama: `Kegiatan Sekolah ${i + 1}`,
    gambar: `https://picsum.photos/seed/schoolact${i + 1}/800/400`
  }));

  const safeIndex = currentIndex < activities.length ? currentIndex : 0;

  // Auto-play timer
  useEffect(() => {
    if (isPaused || activities.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, activities.length]);

  // Auto-scroll indikator agar titik yang aktif selalu terlihat di layar
  useEffect(() => {
    if (indicatorContainerRef.current) {
      const activeIndicator = indicatorContainerRef.current.children[safeIndex] as HTMLElement;
      if (activeIndicator) {
        const container = indicatorContainerRef.current;
        const scrollLeft = activeIndicator.offsetLeft - (container.clientWidth / 2) + (activeIndicator.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [safeIndex]);

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
    setIsPaused(false); // Lanjutkan auto-play setelah selesai drag
    if (activities.length <= 1) return;
    const swipe = offset.x;
    if (swipe < -50) {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    } else if (swipe > 50) {
      setCurrentIndex((prev) => (prev - 1 + activities.length) % activities.length);
    }
  };

  // Smooth fade-in crossfade variants
  const variants = {
    enter: { opacity: 0, scale: 1.05 },
    center: { opacity: 1, scale: 1, zIndex: 1 },
    exit: { opacity: 0, scale: 1, zIndex: 0 }
  };

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 py-3 md:py-4">
        <h3 className="font-bold text-gray-800 mb-3 text-base md:text-lg">Galeri Kegiatan</h3>
        <div className="w-full h-48 md:h-72 rounded-3xl bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  const currentActivity = activities[safeIndex];

  return (
    <div className="px-4 md:px-8 py-3 md:py-4 w-full">
      <h3 className="font-bold text-gray-800 mb-3 text-base md:text-lg">Galeri Kegiatan</h3>
      <div 
        className="relative w-full h-48 md:h-72 rounded-3xl overflow-hidden shadow-sm group bg-gray-900"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={safeIndex}
            src={currentActivity?.gambar || `https://picsum.photos/seed/fallback/800/400`}
            alt={currentActivity?.nama || 'Kegiatan'}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: "easeInOut" }}
            drag={activities.length > 1 ? "x" : false}
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
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-5 md:p-8 pointer-events-none z-10">
          <div className="flex flex-col gap-3 w-full">
            <AnimatePresence mode="wait">
              <motion.h4 
                key={`title-${safeIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-white font-bold text-lg md:text-2xl drop-shadow-lg"
              >
                {currentActivity?.nama || 'Kegiatan'}
              </motion.h4>
            </AnimatePresence>
            
            {/* Indicators - scrollable if too many, positioned below title */}
            {activities.length > 1 && (
              <div 
                ref={indicatorContainerRef}
                className="flex gap-1.5 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pointer-events-auto pb-1"
              >
                {activities.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 shrink-0 ${idx === safeIndex ? `w-6 ${t.primaryBg}` : 'w-1.5 bg-white/50 hover:bg-white'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
