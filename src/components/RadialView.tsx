import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { ThemeConfig } from '../types';

interface RadialViewProps {
  t: ThemeConfig;
  onBack?: () => void;
}

const RADIAL_URL = 'https://radial.misitaluswah.sch.id/';

export default function RadialView({ t }: RadialViewProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-white flex flex-col overflow-hidden z-[70]">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="radial-loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-20 bg-white flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="flex flex-col items-center gap-3">
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

      {/* Embedded RADIAL iframe */}
      <div className="w-full h-full flex-1 min-h-0 relative bg-white">
        <iframe
          src={RADIAL_URL}
          title="RADIAL — Raport Digital MIS IT Al Uswah"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 block"
          allow="clipboard-write"
          loading="eager"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}
