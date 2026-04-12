import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby6a5GzCbHy8NjxOVF7OeGWogdLpEJlXarBDeiG_0BlHtoHDpmKbOEaIf1qzcbN2KpD/exec';

export type AppData = {
  profil: Record<string, string>;
  doa: any[];
  dzikir: any[];
  kalender: any[];
  program: any[];
  ekstra: any[];
  sarpras: any[];
  galeri: any[];
  notifikasi: any[];
  pengumuman: any[];
  header: Record<string, string>;
  sambutan: Record<string, string>;
  review: any[];
  video: any[];
  karyaSiswa: any[];
  footer: Record<string, string>;
};

type DataContextType = {
  data: AppData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(() => {
    const cached = localStorage.getItem('app-data');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (!data) setIsLoading(true);
      setError(null);
      
      // 1. Fetch Home Data (Essential)
      const homeResponse = await fetch(`${SCRIPT_URL}?action=getHomeData&t=${new Date().getTime()}`);
      if (!homeResponse.ok) throw new Error('Gagal mengambil data beranda');
      const homeResult = await homeResponse.json();
      
      if (homeResult.status === 'success') {
        setData(prev => {
          const newData = { ...prev, ...homeResult.data } as AppData;
          localStorage.setItem('app-data', JSON.stringify(newData));
          return newData;
        });
        setIsLoading(false); // UI can render now
      } else {
        throw new Error(homeResult.message || 'Terjadi kesalahan');
      }

      // 2. Fetch Secondary Data (Background)
      const secondaryResponse = await fetch(`${SCRIPT_URL}?action=getSecondaryData&t=${new Date().getTime()}`);
      if (secondaryResponse.ok) {
        const secondaryResult = await secondaryResponse.json();
        if (secondaryResult.status === 'success') {
          setData(prev => {
            const newData = { ...prev, ...secondaryResult.data } as AppData;
            localStorage.setItem('app-data', JSON.stringify(newData));
            return newData;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ data, isLoading, error, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
