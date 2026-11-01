# Rencana Implementasi: Solusi Pembaruan & Cache RADIAL

## 1. Analisis Masalah (Audit Teknis)
Ketika pengguna melakukan *scroll down* (tarik ke bawah) pada tampilan RADIAL:
1. **Isolasi Sentuhan Cross-Origin Iframe**: Web RADIAL (`radial.misitaluswah.sch.id`) dimuat di dalam `<iframe>` dari origin aplikasi AluswahGo. Browser perangkat mobile (Android WebView / iOS WebKit) mengisolasi event sentuhan/gesture di dalam iframe, sehingga *pull-to-refresh* bawaan browser tidak pernah diteruskan ke level induk aplikasi.
2. **HTTP & Disk/Memory Cache Iframe**: URL iframe yang dimuat bersifat statis (`https://radial.misitaluswah.sch.id/`). Browser menyimpan file index HTML, chunk JavaScript, dan bundle CSS di dalam cache HTTP disk/memory. Tanpa parameter pembeda (query parameter), browser akan terus menyajikan file lama dari cache lokal perangkat.
3. **Penyimpanan Sesi / Service Worker RADIAL**: Jika RADIAL menggunakan Service Worker untuk PWA atau Supabase Auth, pembaruan aplikasi hanya akan terinstal secara penuh saat terjadi *top-level navigation* di browser sebenarnya.

---

## 2. Pilihan Solusi yang Telah Disepakati
Berdasarkan hasil klarifikasi:
- **Cache-Buster Otomatis**: Setiap kali menu RADIAL dibuka atau direfresh, URL iframe akan disematkan query parameter unik (misal `?_cb=${Date.now()}`), memaksa browser melewati cache dan mengambil file HTML/JS versi paling mutakhir dari server.
- **Tombol Cadangan Buka di Browser Eksternal**: Menyediakan tombol melayang (*floating micro-button*) yang sangat minimalis, transparan/subtil di sudut layar (tidak mengganggu konten/layar penuh), sehingga guru atau wali murid dapat langsung membuka RADIAL di Chrome/Safari ponsel jika membutuhkan fitur unduh raport atau bypass Service Worker.

---

## 3. Detail Perubahan Kode

### `src/components/RadialView.tsx`
1. **Pembuatan State URL Dinamis dengan Cache-Buster**:
   - Menghasilkan timestamp `cacheBuster` saat komponen di-*mount* atau tombol refresh diklik.
   - Menggabungkan query parameter: `const dynamicUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + '_v=' + cacheBuster;`
2. **Floating Action Minimalis (Micro-FAB)**:
   - Ditempatkan di sudut kanan atas layar (`fixed top-3 right-3 z-30`).
   - Berupa kapsul semi-transparan dengan efek blur (`bg-white/85 backdrop-blur-md shadow-md border border-gray-200/60 rounded-full px-2 py-1 flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity`).
   - Menyediakan 2 ikon ringkas:
     - **Muat Ulang Paksa** (`RefreshCw`): Menghasilkan timestamp baru dan me-reload iframe seketika.
     - **Buka di Browser** (`ExternalLink`): Membuka RADIAL di browser eksternal ponsel untuk keandalan 100%.
3. **Pemberitahuan Singkat**:
   - Menampilkan indikator loading halus saat pembaruan cache sedang berlangsung.

---

## 4. Langkah Verifikasi
1. Melakukan build dan validasi via `compile_applet`.
2. Memastikan navigasi tombol fisik HP (popstate) tetap berfungsi untuk keluar/kembali ke Beranda.
3. Menguji bahwa URL iframe selalu memuat nilai parameter timestamp baru saat menu diakses ulang.
