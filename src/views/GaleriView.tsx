import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { ThemeConfig } from '../types';
import { LazyImage } from '../components/LazyImage';
import { useData } from '../context/DataContext';

export function GaleriView({ t, onBack }: { t: ThemeConfig, onBack: () => void }) {
  const { data, isLoading, error, refreshData } = useData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const formatImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/(.*?)\//);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    return url;
  };

  const items = data?.galeri?.filter(item => item.linkGambar || item.gambar) || [];

  const handleOpenArticle = (link: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-gray-50 z-[60] flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg truncate">Galeri Sekolah</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className={`w-10 h-10 border-4 border-t-transparent ${t.primaryText} rounded-full animate-spin border-opacity-50 mb-4`}></div>
              <p className="text-gray-500 font-medium">Memuat galeri...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 font-medium mb-4">{error}</p>
              <button 
                onClick={() => refreshData()} 
                className={`px-6 py-2 ${t.primaryBg} text-white rounded-full font-medium shadow-sm active:scale-95 transition-transform`}
              >
                Coba Lagi
              </button>
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {items.map((item, idx) => {
                const title = item.judul || item.nama || 'Tanpa Judul';
                const imageUrl = formatImageUrl(item.linkGambar || item.gambar);
                const articleUrl = item.linkArtikel || item.link;
                
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    onClick={() => handleOpenArticle(articleUrl)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-100 shrink-0">
                      <LazyImage 
                        src={imageUrl} 
                        alt={title}
                        containerClassName="w-full h-full"
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                      {articleUrl && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full text-white">
                            <ExternalLink size={24} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4 flex-1 flex flex-col justify-center">
                      <h3 className="font-semibold text-gray-800 text-xs md:text-sm line-clamp-2 leading-snug text-center">
                        {title}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ImageIcon size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Belum ada foto di galeri.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
