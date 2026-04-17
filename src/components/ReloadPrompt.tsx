import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CheckCircle2 } from 'lucide-react';

export default function ReloadPrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
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
    // Beri jeda 1.5 detik agar pengguna bisa melihat notitikasinya sukses
    setTimeout(() => {
      updateServiceWorker(true);
    }, 1500);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 m-4 bg-white rounded-lg shadow-xl border border-teal-100 flex flex-col gap-3 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="text-sm font-medium text-gray-800">
        {isUpdating ? (
          <div className="flex items-center gap-2 text-teal-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Pembaruan sukses! Memuat ulang...</span>
          </div>
        ) : offlineReady ? (
          <span>AluswahGO siap dijalankan secara offline.</span>
        ) : (
          <span>Versi terbaru AluswahGO telah tersedia! Klik perbarui untuk memuat versi baru.</span>
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
