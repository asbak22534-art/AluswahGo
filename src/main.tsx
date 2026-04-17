import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Registrasi Service Worker dengan mode Auto Update Agresif
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Jika ada versi baru terdeteksi di server, aplikasi akan dipaksa reload 
    // agar pengguna langsung mendapatkan versi terbaru
    updateSW(true);
  },
  onOfflineReady() {
    console.log('AluswahGO siap dijalankan offline.');
  },
});

// Cek update di latar belakang setiap kali pengguna fokus kembali ke aplikasi
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateSW(true);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </ThemeProvider>
  </StrictMode>,
);
