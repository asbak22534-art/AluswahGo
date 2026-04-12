import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, CheckCheck, X, FileText, Award, PlayCircle, PenTool, Star, Bell } from 'lucide-react';
import { Notification, ThemeConfig } from '../types';
import { LazyImage } from './LazyImage';

export const NotificationModal: React.FC<{ notif: Notification, onClose: () => void, t: ThemeConfig }> = ({ notif, onClose, t }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        {notif.image && (
          <div className="w-full h-48 relative">
            <LazyImage src={notif.image} alt={notif.title} containerClassName="w-full h-full" className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6">
          {!notif.image && (
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.primaryLightBg} ${t.primaryText}`}>
                {notif.type === 'success' && <CheckCircle2 size={24} />}
                {notif.type === 'info' && <Info size={24} />}
                {notif.type === 'warning' && <AlertTriangle size={24} />}
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-800 mb-1">{notif.title}</h3>
          <p className="text-sm text-gray-500 font-medium mb-4">{notif.time}</p>
          <div className="prose prose-sm text-gray-600 leading-relaxed">
            <p>{notif.fullDesc}</p>
          </div>
          <div className="mt-8">
            <button onClick={onClose} className={`w-full py-3 rounded-xl font-bold text-white ${t.primaryBg} active:scale-[0.98] transition-transform`}>
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export const NotifItem: React.FC<{ notif: Notification, onClick: () => void, t: ThemeConfig }> = ({ notif, onClick, t }) => {
  const [isReadAnimating, setIsReadAnimating] = useState(false);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isReadAnimating) {
      timeoutId = setTimeout(() => {
        setIsReadAnimating(false);
        onClick();
      }, 400); // Wait for checkmark animation
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isReadAnimating, onClick]);

  const handleClick = () => {
    if (notif.unread) {
      setIsReadAnimating(true);
    } else {
      onClick();
    }
  };

  let icon;
  if (notif.image) {
    icon = <LazyImage src={notif.image} alt="Thumbnail" containerClassName="w-10 h-10 rounded-lg shrink-0" className="w-full h-full object-cover" />;
  } else if (notif.type === 'success') {
    icon = <CheckCircle2 size={20} className={t.primaryText} />;
  } else if (notif.type === 'info') {
    icon = <Info size={20} className="text-blue-500" />;
  } else if (notif.type === 'news') {
    icon = <FileText size={20} className={t.primaryText} />;
  } else if (notif.type === 'prestasi') {
    icon = <Award size={20} className="text-amber-500" />;
  } else if (notif.type === 'karya') {
    icon = <PenTool size={20} className="text-purple-500" />;
  } else if (notif.type === 'video') {
    icon = <PlayCircle size={20} className="text-red-500" />;
  } else {
    icon = <AlertTriangle size={20} className="text-amber-500" />;
  }

  let typeIcon;
  let typeLabel = '';
  if (notif.type === 'news') {
    typeIcon = <FileText size={12} className="mr-1 inline" />;
    typeLabel = 'Berita';
  } else if (notif.type === 'video') {
    typeIcon = <PlayCircle size={12} className="mr-1 inline" />;
    typeLabel = 'Video';
  } else if (notif.type === 'karya') {
    typeIcon = <Star size={12} className="mr-1 inline" />;
    typeLabel = 'Karya Siswa';
  } else if (notif.type === 'prestasi') {
    typeIcon = <Award size={12} className="mr-1 inline" />;
    typeLabel = 'Prestasi';
  } else {
    typeIcon = <Bell size={12} className="mr-1 inline" />;
    typeLabel = 'Notifikasi';
  }

  return (
    <motion.div 
      whileTap={{ scale: 0.97, backgroundColor: 'rgba(0,0,0,0.02)' }}
      onClick={handleClick} 
      className={`p-4 border-b border-gray-50 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden ${notif.unread ? t.primaryLightBg + '/30' : ''}`}
    >
      <div className="mt-1 shrink-0 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h5 className={`text-sm font-semibold pr-4 line-clamp-2 ${notif.unread ? 'text-gray-900' : 'text-gray-700'}`}>{notif.desc}</h5>
          <div className="flex items-center h-5 shrink-0">
            <AnimatePresence mode="wait">
              {isReadAnimating ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={t.primaryText}
                >
                  <CheckCheck size={16} />
                </motion.div>
              ) : notif.unread ? (
                <motion.span 
                  key="dot"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className={`w-2.5 h-2.5 rounded-full ${t.primaryBg} transition-colors shadow-sm`}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center text-[10px] text-gray-500 font-medium mt-1">
          {typeIcon}
          <span>{typeLabel} • {notif.time}</span>
        </div>
      </div>
    </motion.div>
  );
}
