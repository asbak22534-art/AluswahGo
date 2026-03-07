import React from 'react';
import { motion } from 'motion/react';
import { ThemeConfig } from '../types';
import { Megaphone } from 'lucide-react';

export function RunningText({ text, t }: { text: string, t: ThemeConfig }) {
  if (!text) return null;

  // Calculate dynamic duration based on text length (approx 30 seconds per 100 characters)
  // Ensure a minimum of 30 seconds so short texts don't fly by too fast
  const duration = Math.max(30, text.length * 0.3);

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0, y: -10 }}
      animate={{ height: 'auto', opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full overflow-hidden z-30 relative origin-top"
    >
      <div className={`w-full ${t.primaryBg} text-white py-2.5 px-4 flex items-center gap-3 shadow-sm`}>
        <style>
          {`
            .marquee-container {
              flex: 1;
              overflow: hidden;
              position: relative;
              height: 24px;
              display: block;
            }
            .marquee-content {
              display: inline-block;
              white-space: nowrap;
              padding-left: 100%;
              animation: marquee ${duration}s linear infinite;
              font-weight: 500;
              font-size: 0.875rem;
              line-height: 24px;
            }
            @keyframes marquee {
              0% { transform: translate(0, 0); }
              100% { transform: translate(-100%, 0); }
            }
          `}
        </style>
        <div className="shrink-0 flex items-center justify-center bg-white/20 p-1.5 rounded-full z-10">
          <Megaphone size={16} className="text-white animate-pulse" />
        </div>
        <div className="marquee-container">
          <div className="marquee-content">
            {text}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SidebarItem({ icon, label, active = false, t, onClick }: { icon: React.ReactNode, label: string, active?: boolean, t: ThemeConfig, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? `${t.primaryLightBg} ${t.primaryText} font-semibold` : `text-gray-500 ${t.hoverPrimaryLight} hover:text-gray-800 font-medium`}`}>
      <div className="transition-colors">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function ActionItem({ icon, label, t, index = 0, onClick }: { icon: React.ReactNode, label: string, t: ThemeConfig, index?: number, onClick?: () => void }) {
  return (
    <motion.button 
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform min-w-0"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-all duration-300 ${t.primaryLightBg} ${t.primaryText} shrink-0`}>
        {icon}
      </div>
      <span className="text-[10px] md:text-xs font-medium text-gray-700 text-center leading-tight break-words whitespace-normal w-full px-1">{label}</span>
    </motion.button>
  );
}

import { Share2 } from 'lucide-react';

export function NewsCard({ title, date, image, index = 0, onClick, link }: { title: string, date: string, image: string, index?: number, onClick?: () => void, link?: string }) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share && link) {
      navigator.share({
        title: title,
        url: link
      }).catch(console.error);
    } else if (link) {
      navigator.clipboard.writeText(link);
      alert('Tautan disalin ke clipboard!');
    }
  };

  return (
    <motion.div 
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white p-2.5 rounded-xl shadow-sm flex gap-3 items-center active:scale-[0.98] transition-transform cursor-pointer border border-gray-100 hover:shadow relative group"
    >
      <img 
        src={image} 
        alt={title} 
        className="w-16 h-16 rounded-lg object-cover bg-gray-200 shrink-0"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1 min-w-0 pr-6">
        <h4 className="font-semibold text-gray-800 text-xs leading-snug line-clamp-2 mb-1">{title}</h4>
        <p className="text-[10px] text-gray-500 font-medium">{date}</p>
      </div>
      {link && (
        <button 
          onClick={handleShare}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
          aria-label="Bagikan"
        >
          <Share2 size={16} />
        </button>
      )}
    </motion.div>
  );
}

export function BottomNavItem({ icon, label, active = false, t, onClick }: { icon: React.ReactNode, label: string, active?: boolean, t: ThemeConfig, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${active ? t.primaryText : 'text-gray-400 hover:text-gray-600'}`}>
      <div className="transition-colors">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
