import React, { useState, useEffect, useMemo } from 'react';
import { ThemeConfig } from '../types';
import { ArrowLeft, Bell, Search, Filter, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../types';
import { NotifItem } from '../components/NotificationComponents';
import { useData } from '../context/DataContext';

const fetchJsonp = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    const script = document.createElement('script');
    
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      resolve(data);
    };

    script.onerror = () => {
      delete (window as any)[callbackName];
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      reject(new Error('JSONP request failed'));
    };

    script.src = `${url}${url.includes('?') ? '&' : '?'}alt=json-in-script&callback=${callbackName}`;
    document.body.appendChild(script);
  });
};

export function NotificationCenterView({ 
  t, 
  onBack,
  onSelectNotif
}: { 
  t: ThemeConfig; 
  onBack: () => void;
  onSelectNotif: (notif: Notification) => void;
}) {
  const { data } = useData();
  const [activeTab, setActiveTab] = useState<'semua' | 'news' | 'prestasi' | 'karya' | 'video'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  // Background Fetching & Merging
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchAllData = async () => {
      try {
        const combinedNotifs: Notification[] = [];

        // Fetch News
        try {
          const newsData = await fetchJsonp('https://www.misitaluswah.sch.id/feeds/posts/default/-/Artikel');
          const entries = newsData.feed?.entry || [];
          entries.forEach((entry: any, idx: number) => {
            let thumbnail = entry.media$thumbnail?.url || '';
            if (thumbnail) {
              thumbnail = thumbnail.replace(/\/(s\d+[^/]*|w\d+[^/]*|h\d+[^/]*)\/([^/]+)$/, '/s1600/$2');
            }
            let pubDate = Date.now();
            try { pubDate = new Date(entry.published?.$t).getTime(); } catch(e) {}
            
            combinedNotifs.push({
              id: `news-${entry.id?.$t || idx}`,
              type: 'news',
              title: 'Berita Baru',
              desc: entry.title?.$t || 'Tanpa Judul',
              fullDesc: entry.title?.$t || 'Tanpa Judul',
              time: new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
              unread: false,
              image: thumbnail,
              linkType: 'news',
              linkData: {
                title: entry.title?.$t || 'Tanpa Judul',
                pubDate: entry.published?.$t || new Date().toISOString(),
                thumbnail: thumbnail || '',
                content: entry.content?.$t || '',
                author: entry.author?.[0]?.name?.$t || 'Admin',
                link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || ''
              },
              timestamp: pubDate
            });
          });
        } catch (e) {
          console.error("Failed to fetch news", e);
        }

        // Fetch Prestasi
        try {
          const prestasiData = await fetchJsonp('https://www.misitaluswah.sch.id/feeds/posts/default/-/Prestasi');
          const entries = prestasiData.feed?.entry || [];
          entries.forEach((entry: any, idx: number) => {
            let thumbnail = entry.media$thumbnail?.url || '';
            if (thumbnail) {
              thumbnail = thumbnail.replace(/\/(s\d+[^/]*|w\d+[^/]*|h\d+[^/]*)\/([^/]+)$/, '/s1600/$2');
            }
            let pubDate = Date.now();
            try { pubDate = new Date(entry.published?.$t).getTime(); } catch(e) {}
            
            combinedNotifs.push({
              id: `prestasi-${entry.id?.$t || idx}`,
              type: 'prestasi',
              title: 'Prestasi Baru',
              desc: entry.title?.$t || 'Tanpa Judul',
              fullDesc: entry.title?.$t || 'Tanpa Judul',
              time: new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
              unread: false,
              image: thumbnail,
              linkType: 'prestasi',
              linkData: {
                title: entry.title?.$t || 'Tanpa Judul',
                pubDate: entry.published?.$t || new Date().toISOString(),
                thumbnail: thumbnail || '',
                content: entry.content?.$t || '',
                author: entry.author?.[0]?.name?.$t || 'Admin',
                link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || ''
              },
              timestamp: pubDate
            });
          });
        } catch (e) {
          console.error("Failed to fetch prestasi", e);
        }

        // Fetch Karya Siswa
        try {
          const karyaData = await fetchJsonp('https://www.misitaluswah.sch.id/feeds/posts/default/-/Karya%20Siswa');
          const entries = karyaData.feed?.entry || [];
          entries.forEach((entry: any, idx: number) => {
            let thumbnail = entry.media$thumbnail?.url || '';
            if (thumbnail) {
              thumbnail = thumbnail.replace(/\/(s\d+[^/]*|w\d+[^/]*|h\d+[^/]*)\/([^/]+)$/, '/s1600/$2');
            }
            let pubDate = Date.now();
            try { pubDate = new Date(entry.published?.$t).getTime(); } catch(e) {}
            
            combinedNotifs.push({
              id: `karya-${entry.id?.$t || idx}`,
              type: 'karya',
              title: 'Karya Siswa Baru',
              desc: entry.title?.$t || 'Tanpa Judul',
              fullDesc: entry.title?.$t || 'Tanpa Judul',
              time: new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
              unread: false,
              image: thumbnail,
              linkType: 'karya',
              linkData: {
                title: entry.title?.$t || 'Tanpa Judul',
                pubDate: entry.published?.$t || new Date().toISOString(),
                thumbnail: thumbnail || '',
                content: entry.content?.$t || '',
                author: entry.author?.[0]?.name?.$t || 'Admin',
                link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || ''
              },
              timestamp: pubDate
            });
          });
        } catch (e) {
          console.error("Failed to fetch karya", e);
        }

        // Add Video from Context
        if (data?.video && data.video.length > 0) {
          data.video.forEach((video: any, idx: number) => {
            const url = video.url_youtube;
            if (!url) return;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (match && match[2].length === 11) {
              const videoId = match[2];
              let videoTime = Date.now() - (idx * 1000);
              if (video.timestamp) {
                try {
                  const parsedTime = new Date(video.timestamp).getTime();
                  if (!isNaN(parsedTime)) {
                    videoTime = parsedTime;
                  }
                } catch (e) {}
              }
              
              combinedNotifs.push({
                id: `video-${videoId}`,
                type: 'video',
                title: 'Video Baru',
                desc: video.judul || 'Video terbaru telah diunggah',
                fullDesc: video.judul || 'Video terbaru telah diunggah',
                time: video.timestamp ? new Date(videoTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja',
                unread: false,
                image: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                linkType: 'video',
                linkData: video,
                timestamp: videoTime
              });
            }
          });
        }

        // Sort by timestamp descending
        combinedNotifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Load read status from localStorage
        const readNotifsStr = localStorage.getItem('readNotifs');
        const readNotifs: string[] = readNotifsStr ? JSON.parse(readNotifsStr) : [];

        const finalNotifs = combinedNotifs.slice(0, 50).map(n => ({
          ...n,
          unread: !readNotifs.includes(n.id)
        }));

        if (isMounted) {
          setNotifications(finalNotifs);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching notification center data:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [data?.video]);

  // Filtering
  const filteredNotifs = useMemo(() => {
    let filtered = notifications;
    if (activeTab !== 'semua') {
      filtered = notifications.filter(n => n.type === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.desc.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [notifications, activeTab, searchQuery]);

  // Incremental Loading (Infinite Scroll simulation)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 100;
    if (bottom && visibleCount < filteredNotifs.length) {
      setVisibleCount(prev => Math.min(prev + 10, filteredNotifs.length));
    }
  };

  const tabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'news', label: 'Berita' },
    { id: 'prestasi', label: 'Prestasi' },
    { id: 'karya', label: 'Karya Siswa' },
    { id: 'video', label: 'Video' }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Header */}
      <div className={`shrink-0 sticky top-0 z-40 px-4 py-3 flex items-center gap-3 shadow-sm ${t.primaryBg} text-white`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Pusat Notifikasi</h1>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm z-30 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari notifikasi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all outline-none"
            />
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setVisibleCount(10);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? `${t.primaryBg} text-white shadow-md` 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="flex-1 overflow-y-auto w-full p-4 md:p-6"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-3 pb-20">
          {isLoading ? (
            // Skeleton Loaders
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-xl shrink-0"></div>
                <div className="flex-1 py-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : filteredNotifs.length > 0 ? (
            <AnimatePresence>
              {filteredNotifs.slice(0, visibleCount).map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx % 10 * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <NotifItem 
                    notif={notif} 
                    onClick={() => onSelectNotif(notif)} 
                    t={t} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Tidak ada notifikasi</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Pencarian tidak ditemukan.' : 'Belum ada notifikasi baru di kategori ini.'}
              </p>
            </div>
          )}
          
          {!isLoading && visibleCount < filteredNotifs.length && (
            <div className="py-4 flex justify-center">
              <div className={`animate-spin rounded-full h-6 w-6 border-b-2 border-current ${t.primaryText}`}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
