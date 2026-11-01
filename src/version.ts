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
  version: '2.6.4',
  buildDate: '1 November 2026',
  buildCode: '20261101.264',
  releaseTag: 'Versi Terbaru',
  appName: 'AluswahGo',
  schoolName: 'MIS IT Al Uswah',
  summary: 'Aplikasi Portal Sekolah Digital terintegrasi dengan RADIAL, SPMB, dan Sistem Akademik MIS IT Al Uswah.',
  changelog: [
    {
      title: 'Perbaikan Anti-Flicker (Bebas Kedip)',
      description: 'Mencegah konflik reload otomatis antara Service Worker PWA dan OneSignal serta mengunci sesi URL iframe RADIAL agar tidak muat ulang ganda.'
    },
    {
      title: 'Auto-Reset ke Beranda saat Muat Ulang',
      description: 'Menjamin aplikasi selalu kembali ke halaman Beranda utama saat di-refresh tanpa terjebak di tampilan layar penuh /#radial.'
    },
    {
      title: 'Workbox NetworkOnly Bypass untuk RADIAL',
      description: 'Menjamin Service Worker AluswahGo tidak pernah mencache aset atau URL radial.misitaluswah.sch.id, memaksa permintaan langsung ke jaringan server CDN.'
    },
    {
      title: 'Tombol Cek Pembaruan & Bersihkan Cache',
      description: 'Tersedia di badge versi pada footer dan menu Profil untuk membersihkan Service Worker dan CacheStorage secara menyeluruh.'
    }
  ]
};

/**
 * Membersihkan semua cache ServiceWorker, CacheStorage, dan mereset tampilan ke Beranda
 * lalu melakukan hard reload untuk memastikan pengguna memuat versi terbaru aplikasi.
 */
export async function clearAppCacheAndReload(): Promise<void> {
  try {
    // 1. Pastikan kembali ke Beranda setelah reload
    try {
      localStorage.setItem('currentView', 'home');
    } catch {}

    // 2. Hapus seluruh isi CacheStorage jika didukung browser
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // 3. Unregister / update service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        try {
          await reg.unregister();
        } catch (e) {
          // ignore
        }
      }
    }

    // 4. Simpan penanda bahwa pembersihan cache baru saja dilakukan
    sessionStorage.setItem('app-cache-flushed', Date.now().toString());

    // 5. Force reload ke root (Beranda) dengan parameter acak untuk bypass browser cache
    const url = new URL(window.location.origin + '/');
    url.searchParams.set('_flush', Date.now().toString());
    window.location.replace(url.toString());
  } catch (error) {
    console.error('Gagal membersihkan cache aplikasi:', error);
    window.location.href = '/';
  }
}
