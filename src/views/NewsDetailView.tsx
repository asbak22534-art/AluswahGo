import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { ThemeConfig } from '../types';

export function NewsDetailView({ t, news, onBack, title = "Detail Berita" }: { t: ThemeConfig, news: any, onBack: () => void, title?: string }) {
  if (!news) return null;

  // Extract text from HTML description if content is not available
  let content = news.content || news.description;
  
  // Optimize images in HTML content by adding lazy loading
  if (content) {
    content = content.replace(/<img /g, '<img loading="lazy" ');
  }

  const handleShare = () => {
    if (navigator.share && news.link) {
      navigator.share({
        title: news.title,
        url: news.link
      }).catch(console.error);
    } else if (news.link) {
      navigator.clipboard.writeText(news.link);
      alert('Tautan disalin ke clipboard!');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-white z-[70] flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg truncate">{title}</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{news.title}</h1>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            {new Date(news.pubDate.replace(' ', 'T')).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {news.author ? ` • Oleh ${news.author}` : ''}
          </p>
          
          <div 
            className="text-gray-700 leading-relaxed space-y-4 [&>p]:mb-4 [&>img]:max-w-full [&>img]:h-auto [&>img]:rounded-xl [&>img]:my-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-5 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-blue-600 [&>a:hover]:underline"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {news.link && (
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-center">
              <button 
                onClick={handleShare}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium shadow-md transition-transform active:scale-95 ${t.primaryBg} hover:opacity-90`}
              >
                <Share2 size={18} />
                Bagikan Artikel Ini
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
