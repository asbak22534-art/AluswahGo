import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { ThemeConfig } from '../types';

interface RadialViewProps {
  t: ThemeConfig;
  onBack?: () => void;
  url?: string;
}

const DEFAULT_RADIAL_URL = 'https://radial.misitaluswah.sch.id/';

/**
 * Membubuhkan parameter cache-buster (_v=timestamp) ke URL agar browser
 * tidak menyajikan halaman/asset versi lama dari memori atau disk cache.
 */
function appendCacheBuster(rawUrl: string, timestamp: number): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.set('_v', String(timestamp));
    return parsed.toString();
  } catch {
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}_v=${timestamp}`;
  }
}

export default function RadialView({ t, url }: RadialViewProps) {
  // Generate timestamp unik setiap kali komponen Radial dibuka
  const [cacheBuster, setCacheBuster] = useState<number>(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const targetBaseUrl = url || DEFAULT_RADIAL_URL;
  const currentIframeSrc = appendCacheBuster(targetBaseUrl, cacheBuster);

  // Watchdog timeout 8 detik agar overlay loading tidak macet jika jaringan lambat
  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [cacheBuster, targetBaseUrl]);

  // Handler untuk memicu reload paksa dengan timestamp baru
  const handleForceRefresh = useCallback(() => {
    setIsLoading(true);
    setCacheBuster(Date.now());
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-white overflow-hidden z-[70]">
      {/* Floating Micro-Pill: Cadangan Buka di Browser Luar & Muat Ulang Paksa (Discreet & Non-Intrusive) */}
      <div className="fixed top-3 right-3 z-30 flex items-center bg-white/85 hover:bg-white backdrop-blur-md border border-gray-200/80 shadow-md rounded-full px-2 py-1 text-gray-700 opacity-75 hover:opacity-100 transition-all duration-200 select-none">
        <button
          onClick={handleForceRefresh}
          title="Segarkan RADIAL (Bypass Cache)"
          aria-label="Segarkan RADIAL"
          className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-transform text-gray-600 hover:text-gray-900"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-teal-600' : ''} />
        </button>

        <span className="w-[1px] h-3 bg-gray-300 mx-1" aria-hidden="true" />

        <a
          href={targetBaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka di Browser Luar (Chrome/Safari)"
          aria-label="Buka di Browser Luar"
          className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-transform text-gray-600 hover:text-gray-900 flex items-center gap-1 text-[11px] font-semibold"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline pr-1">Browser</span>
        </a>
      </div>

      {/* Loading Overlay Layar Penuh dengan Animasi Halus */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key={`radial-loading-${cacheBuster}`}
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded RADIAL iframe Layar Penuh Edge-to-Edge dengan URL Cache-Busted */}
      <iframe
        key={cacheBuster}
        src={currentIframeSrc}
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


