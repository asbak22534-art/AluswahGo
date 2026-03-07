import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { ThemeConfig } from '../types';
import { NewsCard } from '../components/UIComponents';

export function NewsListView({ 
  t, 
  newsList, 
  onBack, 
  onSelectNews 
}: { 
  t: ThemeConfig, 
  newsList: any[], 
  onBack: () => void,
  onSelectNews: (news: any) => void
}) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-gray-50 z-[60] flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg truncate">Semua Kabar Terbaru</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsList.length > 0 ? (
              newsList.map((news, idx) => (
                <NewsCard 
                  key={idx}
                  title={news.title}
                  date={new Date(news.pubDate.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  image={news.thumbnail || `https://picsum.photos/seed/news${idx}/400/300`}
                  index={idx}
                  onClick={() => onSelectNews(news)}
                  link={news.link}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-500">
                Belum ada berita yang tersedia.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
