# Rencana Implementasi: Tampilan Layar Penuh RADIAL & Navigasi Tombol Fisik

Menindaklanjuti preferensi Anda, header navigasi pada menu RADIAL akan dihilangkan sepenuhnya tanpa kontrol di layar, sehingga halaman Raport Digital (RADIAL) tampil 100% penuh (*edge-to-edge / full viewport*), serta navigasi kembali murni mengandalkan tombol kembali fisik perangkat HP (gesture/back button Android) dan tombol undo/kembali pada browser (mode desktop).

---

## 1. Analisis & Alur Navigasi
- **Kondisi Saat Ini**:
  - `RadialView` memiliki header setinggi 48px (`h-12`) dengan tombol Kembali, judul, Refresh, dan Buka di Browser.
  - Saat pengguna masuk ke menu Radial, `App.tsx` menyimpan riwayat navigasi dengan `window.history.pushState({ view: 'radial', appState: true }, '', '#radial')`.
- **Rancangan Baru**:
  - Hilangkan elemen `<header>` dan seluruh tombol di layar dari `RadialView.tsx`.
  - Iframe RADIAL memenuhi 100% layar (`fixed inset-0 w-full h-[100dvh]`).
  - Overlay pemuatan (*loading indicator*) disesuaikan menjadi layar penuh (`inset-0`), tetap mempertahankan proteksi batas waktu *watchdog* 8 detik agar tidak macet bila koneksi lambat.
  - Navigasi kembali otomatis ditangani oleh pendengar *event* `popstate` bawaan di `src/App.tsx`, yang secara mulus mengembalikan tampilan ke Beranda (`home`) saat pengguna menekan tombol fisik kembali di Android atau tombol *Back / Undo* di browser desktop.

---

## 2. Perubahan Komponen

### A. `src/components/RadialView.tsx`
1. **Hapus Elemen Header**:
   - Menghapus tag `<header>` beserta tombol `ArrowLeft`, `RefreshCw`, dan `ExternalLink`.
   - Menghilangkan impor ikon yang tidak lagi digunakan (`ArrowLeft`, `ExternalLink`, `RefreshCw`).
2. **Penyesuaian Loading Overlay**:
   - Ubah posisi kontainer loading dari `top-12` menjadi `inset-0` penuh.
   - Hapus tombol teks "Buka langsung di browser" dari tampilan loading sesuai instruksi pengguna ("Tidak perlu tombol apa pun di layar").
3. **Penyelarasan Layout Iframe**:
   - Jadikan pembungkus iframe mengisi 100% viewport (`w-full h-full inset-0`).
   - Tetap pertahankan atribut keamanan dan kenyamanan iframe (`allow="clipboard-write; fullscreen"`).

### B. `src/App.tsx`
1. Verifikasi penanganan `popstate`:
   - Pastikan saat pengguna berada di `currentView === 'radial'` dan menekan tombol kembali fisik / back browser, `handlePopState` membaca state dan memanggil `setCurrentView('home')` secara presisi tanpa memicu modal keluar aplikasi.
   - Sifat `onBack={handleBack}` pada `RadialView` tetap dipertahankan sebagai antarmuka prop standar jika diperlukan di masa depan.

---

## 3. Langkah Pengujian & Verifikasi
1. **Verifikasi Tampilan Visual**:
   - Masuk ke menu RADIAL, pastikan tidak ada lagi header abu-abu/putih di bagian atas.
   - Iframe RADIAL tampil bersih tanpa potongan atau margin di seluruh layar.
2. **Verifikasi Loading State**:
   - Pastikan animasi spinner "Membuka RADIAL..." muncul di awal dan otomatis memudar begitu iframe selesai dimuat atau setelah batas waktu 8 detik tercapai.
3. **Verifikasi Tombol Kembali Fisik & Browser**:
   - Simulasikan penekanan tombol back pada browser (atau gesture back HP), pastikan aplikasi langsung kembali ke halaman utama AluswahGo.
4. **Kompilasi & Linting**:
   - Jalankan `compile_applet` untuk memastikan kode TypeScript bebas galat dan bersih.
