import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Award, X, ChevronLeft, ChevronRight, Calendar, Tent, FlaskConical, ShieldAlert, Music, Palette, BookOpen, ArrowRight } from 'lucide-react';
import { ThemeConfig } from '../types';
import { Slideshow } from '../components/Slideshow';
import { useData } from '../context/DataContext';

export function EkstraView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const { data, isLoading } = useData();
  const [selectedEkstra, setSelectedEkstra] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedEkstra !== null) {
          setSelectedEkstra(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEkstra, onBack]);

  // Map data from Google Sheets or use fallback
  const ekstrasData = data?.ekstra?.length ? data.ekstra.map((e, index) => ({
    id: index + 1,
    title: e.nama || 'Ekstrakurikuler Tanpa Nama',
    shortDesc: e.deskripsi?.substring(0, 50) + '...' || '',
    desc: e.deskripsi || '',
    icon: <Award size={24} />, // Default icon
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    images: e.gambar ? [e.gambar] : [`https://picsum.photos/seed/ekstra${index}/600/400`],
    schedule: []
  })) : [];

  const activeEkstra = ekstrasData.find(e => e.id === selectedEkstra);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">{title || "Ekstrakurikuler"}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Award className={t.primaryText} />
              Daftar Ekstrakurikuler
            </h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-100 animate-pulse flex flex-col overflow-hidden">
                    <div className="w-full aspect-video bg-gray-200"></div>
                    <div className="p-5">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ekstrasData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ekstrasData.map(ekstra => (
                  <button 
                    key={ekstra.id}
                    onClick={() => setSelectedEkstra(ekstra.id)}
                    className="group relative bg-white rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 text-left flex flex-col overflow-hidden active:scale-[0.98]"
                  >
                    <div className="w-full aspect-[4/3] sm:aspect-video bg-gray-100 relative overflow-hidden">
                      <img 
                        src={ekstra.images[0]} 
                        alt={ekstra.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl shadow-sm transform group-hover:scale-110 transition-transform duration-300">
                        {React.cloneElement(ekstra.icon as React.ReactElement<{ size?: number, className?: string }>, { size: 20, className: ekstra.color.replace('text-', 'text-') })}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col relative bg-white">
                      <h4 className="font-bold text-gray-900 text-xl mb-2 tracking-tight line-clamp-1">{ekstra.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{ekstra.shortDesc}</p>
                      <div className={`mt-auto flex items-center gap-2 text-sm font-bold ${ekstra.color} opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}>
                        Lihat Detail <ArrowRight size={16} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                Belum ada data ekstrakurikuler.
              </div>
            )}
          </div>

        </div>
      </div>

      <AnimatePresence>
        {selectedEkstra && activeEkstra && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedEkstra(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg md:max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative"
            >
              {/* Close button for desktop */}
              <button onClick={() => setSelectedEkstra(null)} className="hidden md:flex absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors z-20">
                <X size={20} />
              </button>

              <div className="relative shrink-0 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 flex flex-col justify-center">
                <Slideshow 
                  images={activeEkstra.images} 
                  t={t} 
                  className="aspect-square w-full bg-gray-50" 
                  objectFit="object-cover" 
                />
                {/* Close button for mobile */}
                <button onClick={() => setSelectedEkstra(null)} className="md:hidden absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors z-20">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar md:w-1/2 flex flex-col">
                <div className="flex items-center gap-3 mb-3 md:pr-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeEkstra.bg} ${activeEkstra.color}`}>
                    {React.cloneElement(activeEkstra.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{activeEkstra.title}</h3>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-6">{activeEkstra.desc}</p>
                
                {activeEkstra.schedule && activeEkstra.schedule.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-2xl text-left border border-gray-100 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Calendar size={18} className={t.primaryText} />
                      Jadwal Pelaksanaan
                    </h4>
                    <div className="space-y-2">
                      {activeEkstra.schedule.map((sch, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                          <span className="font-semibold text-gray-700 min-w-[100px]">{sch.day}</span>
                          <span className="hidden sm:inline text-gray-300">|</span>
                          <span className="text-gray-600">{sch.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-auto pt-4">
                  <button 
                    onClick={() => setSelectedEkstra(null)} 
                    className={`w-full py-3.5 rounded-xl font-bold text-white ${t.primaryBg} active:scale-[0.98] transition-transform`}
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
