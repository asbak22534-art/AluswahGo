export interface AppVersionInfo {
  version: string;
  buildDate: string;
  buildCode: string;
  releaseTag: string;
  appName: string;
  schoolName: string;
  summary: string;
  changelog: {
    title: string;
    description: string;
  }[];
}

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: '2.6.2',
  buildDate: '1 November 2026',
  buildCode: '20261101.262',
  releaseTag: 'Versi Terbaru',
  appName: 'AluswahGo',
  schoolName: 'MIS IT Al Uswah',
  summary: 'Aplikasi Portal Sekolah Digital terintegrasi dengan RADIAL, SPMB, dan Sistem Akademik MIS IT Al Uswah.',
  changelog: [
    {
      title: 'Indikator & Verifikasi Versi Aplikasi',
      description: 'Menampilkan nomor versi resmi (v2.6.2) dan tanggal rilis aplikasi secara transparan di Profil, Header, dan Footer.'
    },
    {
      title: 'Tombol Cek Pembaruan & Bersihkan Cache',
      description: 'Dapat memicu pembersihan Service Worker dan Cache Storage langsung dari aplikasi agar pengguna selalu menerima aset kode terbaru tanpa terjebak cache lawas.'
    },
    {
      title: 'Pembaruan Khusus RADIAL (Raport Digital)',
      description: 'Menyediakan tombol "Segarkan" (hard refresh dengan cache-buster) dan tombol "Buka di Browser" langsung pada tampilan RADIAL untuk mengatasi kendala scroll-down di dalam iframe.'
    },
    {
      title: 'Optimalisasi PWA & Penyimpanan',
      description: 'Penataan otomatis cache browser dan perbaikan deteksi versi baru di perangkat seluler (Android & iOS).'
    }
  ]
};

/**
 * Membersihkan semua cache ServiceWorker, CacheStorage, dan sessionStorage/localStorage
 * lalu melakukan hard reload untuk memastikan pengguna memuat versi terbaru aplikasi.
 */
export async function clearAppCacheAndReload(): Promise<void> {
  try {
    // 1. Hapus seluruh isi CacheStorage jika didukung browser
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // 2. Unregister / update service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        try {
          await reg.update();
        } catch (e) {
          // Jika gagal update, unregister agar install ulang yang fresh
          await reg.unregister();
        }
      }
    }

    // 3. Simpan penanda bahwa pembersihan cache baru saja dilakukan
    sessionStorage.setItem('app-cache-flushed', Date.now().toString());

    // 4. Force reload ke root dengan parameter acak untuk bypass browser cache
    const url = new URL(window.location.href);
    url.searchParams.set('_flush', Date.now().toString());
    window.location.href = url.toString();
  } catch (error) {
    console.error('Gagal membersihkan cache aplikasi:', error);
    // Fallback reload biasa
    window.location.reload();
  }
}
