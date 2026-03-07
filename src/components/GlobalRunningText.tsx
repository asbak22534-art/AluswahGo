import React from 'react';
import { useData } from '../context/DataContext';
import { ThemeConfig } from '../types';
import { RunningText } from './UIComponents';

export function GlobalRunningText({ t }: { t: ThemeConfig }) {
  const { data } = useData();
  
  if (!data?.pengumuman || !Array.isArray(data.pengumuman) || data.pengumuman.length === 0) return null;
  
  const validPengumuman = data.pengumuman.filter(p => {
    if (!p) return false;
    
    // Cari key untuk 'aktif' dan 'teks' (case-insensitive)
    const aktifKey = Object.keys(p).find(k => k.toLowerCase().trim() === 'aktif') || 'aktif';
    const teksKey = Object.keys(p).find(k => k.toLowerCase().trim() === 'teks' || k.toLowerCase().trim() === 'pengumuman') || 'teks';
    
    const isAktif = p[aktifKey];
    const teksVal = p[teksKey];
    
    // Validasi teks tidak kosong
    if (!teksVal || String(teksVal).trim() === '') return false;
    
    // Validasi status aktif
    if (isAktif === true) return true;
    const val = String(isAktif || '').trim().toUpperCase();
    return val === 'TRUE' || val === 'YA' || val === 'Y' || val === '1' || val === 'AKTIF';
  }).map(p => {
    const teksKey = Object.keys(p).find(k => k.toLowerCase().trim() === 'teks' || k.toLowerCase().trim() === 'pengumuman') || 'teks';
    return String(p[teksKey]).trim();
  });
  
  if (validPengumuman.length > 0) {
    // Gabungkan semua pengumuman yang aktif dengan pemisah
    const combinedText = validPengumuman.join('  ✦  ');
    return <RunningText text={combinedText} t={t} />;
  }
  return null;
}
