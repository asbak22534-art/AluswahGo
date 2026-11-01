import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckCircle2, RefreshCw, Smartphone, ShieldCheck, 
  ExternalLink, Sparkles, Layers, Info
} from 'lucide-react';
import { APP_VERSION_CONFIG, clearAppCacheAndReload } from '../version';
import { ThemeConfig } from '../types';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: ThemeConfig;
}

export function VersionModal({ isOpen, onClose, t }: VersionModalProps) {
  const [isFlushing, setIsFlushing] = useState(false);
  const [showStatusSuccess, setShowStatusSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClearCache = async () => {
    setIsFlushing(true);
    setShowStatusSuccess(false);
    try {
      // Berikan feedback visual singkat sebelum reload
      setTimeout(async () => {
        await clearAppCacheAndReload();
      }, 800);
    } catch (err) {
      console.error(err);
      setIsFlushing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className={`px-6 py-5 bg-gradient-to-r ${t.gradient} text-white flex items-center justify-between shadow-sm relative overflow-hidden`}>
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Sparkles size={22} className="text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white leading-tight">Detail Versi Aplikasi</h3>
                <p className="text-xs text-white/80 font-medium">Informasi & Status Rilis {APP_VERSION_CONFIG.appName}</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="relative z-10 p-2 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
              aria-label="Tutup Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Main Version Badge Card */}
            <div className="bg-gradient-to-br from-gray-50 to-teal-50/30 border border-teal-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0 text-teal-600">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="font-black text-2xl text-gray-900 tracking-tight">
                      v{APP_VERSION_CONFIG.version}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {APP_VERSION_CONFIG.releaseTag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Dirilis: {APP_VERSION_CONFIG.buildDate} • Kode Build: <code className="bg-gray-200/70 px-1 py-0.5 rounded text-[11px] text-gray-700">{APP_VERSION_CONFIG.buildCode}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Status Penjelasan Cache & RADIAL */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs leading-relaxed">
              <Info size={20} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 mb-1">
                  Mekanisme Pembaruan Halaman RADIAL (Raport Digital)
                </p>
                <p className="text-amber-800">
                  Halaman <strong>RADIAL</strong> berjalan di dalam iframe domain mandiri (<code className="bg-amber-100/70 px-1 py-0.5 rounded text-[10px]">radial.misitaluswah.sch.id</code>). Standar keamanan browser memisahkan penyimpanan cache dan Service Worker antar domain.
                </p>
                <p className="text-amber-800 mt-1.5">
                  Oleh karena itu, sistem Al Uswah Go secara otomatis menyematkan <em>cache-buster</em> (sinkronisasi timestamp) setiap kali menu RADIAL dibuka sehingga selalu memuat berkas terbaru tanpa perlu tombol tambahan di layar.
                </p>
              </div>
            </div>

            {/* Clear Cache Action Button */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-bold text-gray-800">Masih Melihat Versi Lama?</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bersihkan cache memori browser dan Service Worker agar aplikasi dimuat fresh.
                </p>
              </div>

              <button
                onClick={handleClearCache}
                disabled={isFlushing}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 shrink-0 ${
                  isFlushing ? 'bg-gray-400 cursor-not-allowed' : `${t.primaryBg} hover:opacity-95`
                }`}
              >
                <RefreshCw size={14} className={isFlushing ? 'animate-spin' : ''} />
                <span>{isFlushing ? 'Membersihkan Cache...' : 'Bersihkan Cache & Perbarui'}</span>
              </button>
            </div>

            {/* Changelog Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers size={16} className="text-gray-500" />
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Catatan Pembaruan Rilis
                </h4>
              </div>

              <div className="space-y-2.5">
                {APP_VERSION_CONFIG.changelog.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-gray-50 hover:bg-teal-50/30 transition-colors border border-gray-100 rounded-xl flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-800">{item.title}</h5>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copyright & School Info */}
            <div className="text-center pt-2 border-t border-gray-100 text-[11px] text-gray-400">
              <p>{APP_VERSION_CONFIG.appName} • {APP_VERSION_CONFIG.schoolName}</p>
              <p className="mt-0.5">Seluruh Hak Cipta Dilindungi © {new Date().getFullYear()}</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors active:scale-95"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
