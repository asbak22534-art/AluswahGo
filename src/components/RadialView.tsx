import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ExternalLink } from 'lucide-react';
import { ThemeConfig } from '../types';

interface RadialViewProps {
  t: ThemeConfig;
  onBack?: () => void;
  url?: string;
}

const DEFAULT_RADIAL_URL = 'https://radial.misitaluswah.sch.id/';

/**
 * Membubuhkan parameter cache-buster (v=timestamp&_t=timestamp) ke URL agar browser
 * tidak menyajikan halaman/asset versi lama dari memori atau disk cache.
 */
function appendCacheBuster(rawUrl: string, timestamp: number): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.set('v', String(timestamp));
    parsed.searchParams.set('_t', String(timestamp));
    return parsed.toString();
  } catch {
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}v=${timestamp}&_t=${timestamp}`;
  }
}

export default function RadialView({ t, url }: RadialViewProps) {
  // Kunci URL & timestamp sekali saja saat komponen dipasang (mount)
  // agar pembaruan data background (DataContext) tidak memicu reload ulang / kedipan (flicker) pada iframe
  const [sessionConfig] = useState(() => {
    const ts = Date.now();
    const base = (url && url.trim()) ? url.trim() : DEFAULT_RADIAL_URL;
    return {
      timestamp: ts,
      iframeSrc: appendCacheBuster(base, ts),
    };
  });

  const [isLoading, setIsLoading] = useState(true);

  // Watchdog timeout 8 detik agar overlay loading tidak macet jika jaringan lambat
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-white overflow-hidden z-[70] flex flex-col">
      {/* Loading Overlay Layar Penuh dengan Animasi Halus saat Sinkronisasi Timestamp */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="radial-loading-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="flex flex-col items-center gap-3 max-w-xs">
              <div className={`w-12 h-12 rounded-2xl ${t.primaryLightBg} flex items-center justify-center shadow-inner`}>
                <Loader2 className={`w-6 h-6 animate-spin ${t.primaryText}`} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-800 tracking-tight">
                  Memuat Versi Terbaru...
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Raport Digital (RADIAL) MIS IT Al Uswah
                </p>
                <p className="text-[11px] text-gray-400">
                  Sinkronisasi timestamp: {sessionConfig.timestamp}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={sessionConfig.iframeSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <ExternalLink size={13} />
                  <span>Buka di Browser Luar</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded RADIAL iframe Layar Penuh Edge-to-Edge dengan URL Cache-Busted */}
      <iframe
        id="radial-iframe"
        src={sessionConfig.iframeSrc}
        title="RADIAL — Raport Digital MIS IT Al Uswah"
        onLoad={() => {
          setIsLoading(false);
        }}
        className="w-full h-full border-0 block flex-1"
        allow="clipboard-write; fullscreen"
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
