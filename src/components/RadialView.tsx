import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { ThemeConfig } from '../types';

interface RadialViewProps {
  t: ThemeConfig;
  onBack?: () => void;
  url?: string;
}

const DEFAULT_RADIAL_URL = 'https://radial.misitaluswah.sch.id/';

export default function RadialView({ t, onBack, url }: RadialViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const targetUrl = url || DEFAULT_RADIAL_URL;

  // Watchdog timeout 8 detik agar loading spinner tidak menggantung selamanya
  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [targetUrl]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-white overflow-hidden z-[70]">
      {/* Loading Overlay Layar Penuh */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="radial-loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="flex flex-col items-center gap-3 max-w-xs">
              <div className={`w-12 h-12 rounded-2xl ${t.primaryLightBg} flex items-center justify-center shadow-inner`}>
                <Loader2 className={`w-6 h-6 animate-spin ${t.primaryText}`} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-800 tracking-tight">
                  Membuka RADIAL...
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Raport Digital MIS IT Al Uswah
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded RADIAL iframe Layar Penuh Edge-to-Edge */}
      <iframe
        src={targetUrl}
        title="RADIAL — Raport Digital MIS IT Al Uswah"
        onLoad={() => {
          setIsLoading(false);
        }}
        className="w-full h-full border-0 block"
        allow="clipboard-write; fullscreen"
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

