import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * ReloadPrompt: Menangani siklus hidup Service Worker secara hening (silent) di latar belakang
 * tanpa menampilkan toast atau pop-up yang mengganggu pengguna.
 */
export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Cek update di background secara berkala (setiap 30 menit)
        const intervalId = setInterval(() => {
          r.update().catch(() => {});
        }, 30 * 60 * 1000);

        window.addEventListener('beforeunload', () => {
          clearInterval(intervalId);
        });
      }
    },
    onRegisterError(error) {
      console.log('SW registration error:', error);
    },
  });

  // Saat versi baru terdeteksi, perbarui otomatis di latar belakang tanpa mengganggu UI
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true).catch(() => {});
    }
  }, [needRefresh, updateServiceWorker]);

  // Tidak ada UI pop-up yang mengganggu layar pengguna
  return null;
}
