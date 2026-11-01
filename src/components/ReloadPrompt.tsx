import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * ReloadPrompt: Menangani siklus hidup Service Worker secara pasif di latar belakang
 * tanpa memicu window.location.reload() otomatis yang menyebabkan layar berkedip (flicker),
 * serta menonaktifkan SW di dalam iframe preview (AI Studio / dev).
 */
export default function ReloadPrompt() {
  useRegisterSW({
    immediate: false,
    onRegistered(r) {
      if (!r) return;

      // Jangan jalankan auto-check agresif di dalam iframe preview AI Studio
      const isPreviewIframe = (() => {
        try {
          return window.self !== window.top || window.location.hostname.includes('.run.app');
        } catch {
          return true;
        }
      })();

      if (isPreviewIframe) {
        r.unregister().catch(() => {});
        return;
      }

      // Cek update di background secara berkala (setiap 60 menit) tanpa memaksa reload halaman aktif
      const intervalId = setInterval(() => {
        r.update().catch(() => {});
      }, 60 * 60 * 1000);

      window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
      });
    },
    onRegisterError(error) {
      console.log('SW registration error:', error);
    },
  });

  // Bersihkan SW lama jika berjalan di dalam preview AI Studio (.run.app) agar tidak terjadi loop reload
  useEffect(() => {
    const isPreviewHost = window.location.hostname.includes('.run.app');
    if (isPreviewHost && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  return null;
}
