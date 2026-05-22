import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CheckCircle2 } from 'lucide-react';

export default function ReloadPrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMuted] = useState(() => {
    return sessionStorage.getItem('pwa-just-updated') === 'true';
  });

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      if (sessionStorage.getItem('pwa-just-updated')) {
        setTimeout(() => sessionStorage.removeItem('pwa-just-updated'), 5000);
      }
      if (r) {
        // Cek update saat aplikasi kembali fokus (misal user membuka HP / kembali dari lock screen)
        const checkUpdateOnFocus = () => {
          if (document.visibilityState === 'visible') {
            r.update().catch(err => console.log('SW update error on focus check', err));
          }
        };
        document.addEventListener('visibilitychange', checkUpdateOnFocus);

        // Cek update secara berkala setiap 5 menit secara pasif di latar belakang
        const intervalId = setInterval(() => {
          r.update().catch(err => console.log('SW update error on interval check', err));
        }, 5 * 60 * 1000);

        // Bersihkan event listener & interval ketika window unload/tidak terpakai
        window.addEventListener('beforeunload', () => {
          document.removeEventListener('visibilitychange', checkUpdateOnFocus);
          clearInterval(intervalId);
        });
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    sessionStorage.setItem('pwa-just-updated', 'true');
    // Beri jeda 1.5 detik agar pengguna melihat notifikasi sukses, lalu paksa reload
    setTimeout(() => {
      updateServiceWorker(true).then(() => {
        window.location.reload();
      }).catch(() => {
        window.location.reload();
      });
    }, 1500);
  };

  // Sembunyikan otomatis pesan "Aplikasi siap offline" setelah 3 detik
  useEffect(() => {
    if (offlineReady) {
      const timeoutId = setTimeout(() => {
        close();
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [offlineReady]);

  // Penghilang otomatis 3 menit untuk update
  useEffect(() => {
    if (needRefresh && !isUpdating) {
      const timeoutId = setTimeout(() => {
        close();
      }, 180000); // 180 detik = 3 menit
      return () => clearTimeout(timeoutId);
    }
  }, [needRefresh, isUpdating]);

  if ((!offlineReady && !needRefresh) || isMuted) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 right-0 z-[9999] p-4 m-4 bg-white rounded-lg shadow-xl border border-teal-100 flex flex-col gap-3 max-w-sm animate-in slide-in-from-bottom-5 transition-opacity duration-500`}>
      <div className="text-sm font-medium text-gray-800">
        {isUpdating ? (
          <div className="flex items-center gap-2 text-teal-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Pembaruan sukses! Memuat ulang...</span>
          </div>
        ) : offlineReady ? (
          <span>MIS IT Al Uswah siap dijalankan secara offline.</span>
        ) : (
          <span>Versi terbaru MIS IT Al Uswah telah tersedia! Klik perbarui untuk memuat versi baru.</span>
        )}
      </div>
      
      {!isUpdating && (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => close()}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Nanti
          </button>
          {needRefresh && (
            <button
              onClick={handleUpdate}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors shadow-sm"
            >
              Perbarui Sekarang
            </button>
          )}
        </div>
      )}
    </div>
  );
}
