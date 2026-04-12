import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Building, X, ChevronLeft, ChevronRight, Utensils, Activity, Wind, TreePine, Projector, Droplets, Moon, Flag } from 'lucide-react';
import { ThemeConfig } from '../types';
import { Slideshow } from '../components/Slideshow';
import { useData } from '../context/DataContext';

export function SarprasView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const { data, isLoading } = useData();
  const [selectedSarpras, setSelectedSarpras] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSarpras !== null) {
          setSelectedSarpras(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSarpras, onBack]);

  // Map data from Google Sheets or use fallback
  const sarprasListData = data?.sarpras?.length ? data.sarpras.map((s, index) => ({
    id: index + 1,
    title: s.nama || 'Fasilitas Tanpa Nama',
    shortDesc: s.deskripsi?.substring(0, 50) + '...' || '',
    desc: s.deskripsi || '',
    icon: <Building size={24} />, // Default icon
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    images: s.gambar ? [s.gambar] : [`https://picsum.photos/seed/sarpras${index}/600/400`]
  })) : [];

  const activeSarpras = sarprasListData.find(s => s.id === selectedSarpras);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">{title || "Sarana & Prasarana"}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Building className={t.primaryText} />
              Fasilitas Sekolah
            </h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 animate-pulse flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sarprasListData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sarprasListData.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setSelectedSarpras(item.id)}
                    className="bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all text-left flex items-start gap-4 active:scale-95"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.shortDesc}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                Belum ada data sarana dan prasarana.
              </div>
            )}
          </div>

        </div>
      </div>

      <AnimatePresence>
        {selectedSarpras && activeSarpras && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSarpras(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="relative shrink-0">
                <Slideshow images={activeSarpras.images} t={t} />
                <button onClick={() => setSelectedSarpras(null)} className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors z-20">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeSarpras.bg} ${activeSarpras.color}`}>
                    {React.cloneElement(activeSarpras.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{activeSarpras.title}</h3>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-6">{activeSarpras.desc}</p>
                
                <button 
                  onClick={() => setSelectedSarpras(null)} 
                  className={`w-full py-3.5 mt-2 rounded-xl font-bold text-white ${t.primaryBg} active:scale-[0.98] transition-transform`}
                >
                  Tutup Detail
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
