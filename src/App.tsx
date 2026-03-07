import React, { useState, Suspense, useEffect } from 'react';
import { 
  Bell, Home, Compass, Grid, User, GraduationCap, FileText, 
  Wallet, CalendarCheck, MessageSquare, BookOpen, X, Palette,
  CheckCheck, BellOff, Book, Heart, Calendar, Users, Star, Award, Building, PieChart,
  Play, Facebook, Instagram, Youtube, MapPin, MessageCircle, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from './types';
import { themeConfig } from './theme';
import { DateTimeAndTA } from './components/DateTimeAndTA';
import { ActivitySlideshow } from './components/ActivitySlideshow';
import { NotificationModal, NotifItem } from './components/NotificationComponents';
import { SidebarItem, ActionItem, NewsCard, BottomNavItem, RunningText } from './components/UIComponents';
import { GlobalRunningText } from './components/GlobalRunningText';
import { Chatbot } from './components/Chatbot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './context/ThemeContext';
import { useData } from './context/DataContext';
import { NewsDetailView } from './views/NewsDetailView';
import { VideoModal } from './components/VideoModal';

// Lazy load views
const QuranView = React.lazy(() => import('./views/QuranView').then(m => ({ default: m.QuranView })));
const DoaView = React.lazy(() => import('./views/DoaView').then(m => ({ default: m.DoaView })));
const KalenderView = React.lazy(() => import('./views/KalenderView').then(m => ({ default: m.KalenderView })));
const SPMBView = React.lazy(() => import('./views/SPMBView').then(m => ({ default: m.SPMBView })));
const KritikView = React.lazy(() => import('./views/KritikView').then(m => ({ default: m.KritikView })));
const ProgramView = React.lazy(() => import('./views/ProgramView').then(m => ({ default: m.ProgramView })));
const EkstraView = React.lazy(() => import('./views/EkstraView').then(m => ({ default: m.EkstraView })));
const SarprasView = React.lazy(() => import('./views/SarprasView').then(m => ({ default: m.SarprasView })));
const NewsListView = React.lazy(() => import('./views/NewsListView').then(m => ({ default: m.NewsListView })));
const ProfilView = React.lazy(() => import('./views/ProfilView').then(m => ({ default: m.ProfilView })));

const renderHighlightedText = (text: string, highlight: string, color: string) => {
  if (!highlight) return text;
  
  // Escape regex characters to prevent errors
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  
  if (!regex.test(text)) return text;
  
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        // Even indices are non-matches, odd indices are matches
        if (i % 2 === 1) {
          return (
            <span key={i} style={{ color: color }} className="drop-shadow-sm">
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

function useAutoScroll(intervalMs = 3000) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const child = scrollRef.current.firstElementChild as HTMLElement;
          const cardWidth = child ? child.offsetWidth + 16 : 300;
          scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isPaused, intervalMs]);

  return { scrollRef, setIsPaused };
}

export default function App() {
  const { theme: t, themeName, setThemeName } = useTheme();
  const { data, isLoading } = useData();
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'quran' | 'doa' | 'kalender' | 'spmb' | 'kritik' | 'program' | 'ekstra' | 'sarpras' | 'news' | 'profil'>('home');

  const { scrollRef: prestasiRef, setIsPaused: setPrestasiPaused } = useAutoScroll(3500);
  const { scrollRef: reviewRef, setIsPaused: setReviewPaused } = useAutoScroll(4000);
  const { scrollRef: optionalRef, setIsPaused: setOptionalPaused } = useAutoScroll(4200);
  const { scrollRef: videoRef, setIsPaused: setVideoPaused } = useAutoScroll(4500);

  // State for Optional Section
  const [optionalSection, setOptionalSection] = useState<{title: string, url: string, status: boolean, data: any[]} | null>(null);
  const [isLoadingOptional, setIsLoadingOptional] = useState(true);

  // State for News
  const [newsList, setNewsList] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // State for Prestasi
  const [selectedPrestasi, setSelectedPrestasi] = useState<any | null>(null);
  const [prestasiList, setPrestasiList] = useState<any[]>([]);
  const [isLoadingPrestasi, setIsLoadingPrestasi] = useState(true);

  // State for Video
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  useEffect(() => {
    const fetchNews = () => {
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      
      (window as any)[callbackName] = (data: any) => {
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
        
        if (data && data.feed && data.feed.entry) {
          const formattedNews = data.feed.entry.map((entry: any) => {
            // Try to extract first image from content (usually higher quality)
            let thumbnail = '';
            const contentHtml = entry.content?.$t || '';
            const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
            
            if (imgMatch && imgMatch[1]) {
              thumbnail = imgMatch[1];
            } else if (entry.media$thumbnail?.url) {
              // Fallback to media$thumbnail if no image in content
              thumbnail = entry.media$thumbnail.url;
            }
            
            // Fix thumbnail size (Blogger often returns small images, we want a larger one like s1600)
            if (thumbnail) {
              // Matches /s72-c/, /w400-h300/, /s320-sn/, etc. right before the filename
              thumbnail = thumbnail.replace(/\/(s\d+[^/]*|w\d+[^/]*|h\d+[^/]*)\/([^/]+)$/, '/s1600/$2');
            }
            
            return {
              title: entry.title?.$t || 'Tanpa Judul',
              pubDate: entry.published?.$t || new Date().toISOString(),
              thumbnail: thumbnail || '',
              content: entry.content?.$t || '',
              author: entry.author?.[0]?.name?.$t || 'Admin',
              link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || ''
            };
          });
          setNewsList(formattedNews);
        }
        setIsLoadingNews(false);
      };

      const script = document.createElement('script');
      script.id = callbackName;
      script.src = `https://www.misitaluswah.sch.id/feeds/posts/default?alt=json-in-script&callback=${callbackName}`;
      script.onerror = () => {
        console.error("Gagal mengambil berita: JSONP request failed");
        setIsLoadingNews(false);
      };
      document.body.appendChild(script);
    };
    
    const fetchPrestasi = () => {
      const callbackName = 'jsonp_callback_prestasi_' + Math.round(100000 * Math.random());
      
      (window as any)[callbackName] = (data: any) => {
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
        
        if (data && data.feed && data.feed.entry) {
          const formattedPrestasi = data.feed.entry.map((entry: any) => {
            // Try to extract first image from content (usually higher quality)
            let thumbnail = '';
            const contentHtml = entry.content?.$t || '';
            const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
            
            if (imgMatch && imgMatch[1]) {
              thumbnail = imgMatch[1];
            } else if (entry.media$thumbnail?.url) {
              // Fallback to media$thumbnail if no image in content
              thumbnail = entry.media$thumbnail.url;
            }
            
            if (thumbnail) {
              thumbnail = thumbnail.replace(/\/(s\d+[^/]*|w\d+[^/]*|h\d+[^/]*)\/([^/]+)$/, '/s1600/$2');
            }
            return {
              title: entry.title?.$t || 'Tanpa Judul',
              pubDate: entry.published?.$t || new Date().toISOString(),
              thumbnail: thumbnail || '',
              content: entry.content?.$t || '',
              author: entry.author?.[0]?.name?.$t || 'Admin',
              link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || ''
            };
          });
          setPrestasiList(formattedPrestasi);
        }
        setIsLoadingPrestasi(false);
      };

      const script = document.createElement('script');
      script.id = callbackName;
      script.src = `https://www.misitaluswah.sch.id/feeds/posts/default/-/Prestasi?alt=json-in-script&callback=${callbackName}`;
      script.onerror = () => {
        console.error("Gagal mengambil prestasi: JSONP request failed");
        setIsLoadingPrestasi(false);
      };
      document.body.appendChild(script);
    };

    const fetchOptionalData = (sourceUrl: string, title: string) => {
      let feedUrl = sourceUrl;
      if (sourceUrl.includes('/search/label/')) {
        const label = sourceUrl.split('/search/label/')[1].split('?')[0];
        feedUrl = `https://www.misitaluswah.sch.id/feeds/posts/default/-/${label}`;
      }
      
      const callbackName = 'jsonp_callback_optional_' + Math.round(100000 * Math.random());
      const finalUrl = feedUrl.includes('?') 
        ? `${feedUrl}&alt=json-in-script&callback=${callbackName}`
        : `${feedUrl}?alt=json-in-script&callback=${callbackName}`;

      (window as any)[callbackName] = (data: any) => {
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script) document.body.removeChild(script);
        
        if (data && data.feed && data.feed.entry) {
          const formattedData = data.feed.entry.map((entry: any) => {
            let thumbnail = '';
            const contentHtml = entry.content?.$t || '';
            const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
            
            if (imgMatch && imgMatch[1]) {
              thumbnail = imgMatch[1];
            } else if (entry.media$thumbnail?.url) {
              thumbnail = entry.media$thumbnail.url;
            }
            
            if (thumbnail) {
              thumbnail = thumbnail.replace(/\/(s\d+[^/]*|w\d+[^/]*|h\d+[^/]*)\/([^/]+)$/, '/s1600/$2');
            }
            
            return {
              title: entry.title?.$t || 'Tanpa Judul',
              pubDate: entry.published?.$t || new Date().toISOString(),
              thumbnail: thumbnail || '',
              content: entry.content?.$t || '',
              author: entry.author?.[0]?.name?.$t || 'Admin',
              link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || ''
            };
          });
          setOptionalSection({ title, url: sourceUrl, status: true, data: formattedData });
        } else {
          setOptionalSection({ title, url: sourceUrl, status: true, data: [] });
        }
        setIsLoadingOptional(false);
      };

      const script = document.createElement('script');
      script.id = callbackName;
      script.src = finalUrl;
      script.onerror = () => {
        console.error("Gagal mengambil data opsional");
        setIsLoadingOptional(false);
      };
      document.body.appendChild(script);
    };

    const fetchOptionalConfig = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s/gviz/tq?tqx=out:csv&sheet=Opsional');
        if (!response.ok) {
          setIsLoadingOptional(false);
          return;
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => {
          let cleanRow = row.trim();
          if (cleanRow.startsWith('"') && cleanRow.endsWith('"')) {
            cleanRow = cleanRow.substring(1, cleanRow.length - 1);
            return cleanRow.split('","');
          }
          return cleanRow.split(',');
        });

        if (rows.length > 1) {
          const title = rows[1][0] || '';
          const url = rows[1][1] || '';
          const statusStr = (rows[1][2] || '').toLowerCase();
          const status = statusStr === 'true' || statusStr === '1' || statusStr === 'yes' || statusStr === 'ya' || statusStr === 'aktif';

          if (title && url && status) {
            fetchOptionalData(url, title);
          } else {
            setIsLoadingOptional(false);
          }
        } else {
          setIsLoadingOptional(false);
        }
      } catch (error) {
        console.error("Failed to fetch optional config", error);
        setIsLoadingOptional(false);
      }
    };
    
    fetchNews();
    fetchPrestasi();
    fetchOptionalConfig();
  }, []);

  // Data Notifikasi
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (data?.notifikasi) {
      // Format notifikasi dari Google Sheets
      const formattedNotifs = data.notifikasi.map((n: any, idx: number) => ({
        id: n.id || `notif-${idx}`,
        type: (n.type as 'info' | 'success' | 'warning' | 'error') || 'info',
        title: n.title || 'Notifikasi',
        desc: n.desc || '',
        fullDesc: n.fullDesc || n.desc || '',
        time: n.time || 'Baru saja',
        unread: true, // Default unread untuk notifikasi baru
        image: n.image || undefined
      }));
      setNotifications(formattedNotifs);
    }
  }, [data?.notifikasi]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const toggleTheme = () => {
    const themes: ('emerald' | 'cyan' | 'pastelPink' | 'pastelMint' | 'indigo' | 'amber' | 'violet' | 'slate' | 'instagram' | 'youtube')[] = [
      'emerald', 'cyan', 'pastelPink', 'pastelMint', 'indigo', 'amber', 'violet', 'slate', 'instagram', 'youtube'
    ];
    const currentIndex = themes.indexOf(themeName as any);
    setThemeName(themes[(currentIndex + 1) % themes.length]);
  };

  const handleNotifClick = (notif: Notification) => {
    setSelectedNotif(notif);
    setShowNotifs(false); // Tutup dropdown
    // Tandai sebagai dibaca
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNotifs) setShowNotifs(false);
        if (selectedNotif) setSelectedNotif(null);
        if (selectedPrestasi) setSelectedPrestasi(null);
        if (selectedVideo) setSelectedVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotifs, selectedNotif, selectedPrestasi, selectedVideo]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-gray-200 min-h-screen w-full max-w-full flex justify-center overflow-x-hidden">
      {/* Main Container */}
      <div className="w-full max-w-full lg:max-w-6xl bg-gray-50 h-[100dvh] relative lg:shadow-2xl overflow-hidden flex flex-col lg:flex-row font-sans transition-colors duration-300">
        
        {/* Sidebar (Desktop Only) */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col z-40 shadow-sm shrink-0">
          <div className="p-6 flex items-center gap-3 border-b border-gray-50">
            {isLoading ? (
              <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse shrink-0"></div>
            ) : (
              <img 
                src={data?.header?.logo || "https://lh3.googleusercontent.com/a/ACg8ocLjDVk3HM6HfZrRk4kJAwJveT-6ZvIEr97Ky1y_vL0a2L6Nhd4=s400-c"} 
                alt={`Logo ${data?.header?.judul || "MIS IT Al Uswah"}`} 
                className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0">
              {isLoading ? (
                <>
                  <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-20 h-3 bg-gray-200/60 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <h1 className="font-bold text-gray-800 leading-tight truncate">{data?.header?.judul || "Al Uswah"}</h1>
                  <p className={`text-xs ${t.primaryText} font-medium transition-colors line-clamp-2`}>{data?.header?.sub_judul || "Portal Sekolah"}</p>
                </>
              )}
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
            <SidebarItem icon={<Home size={20} />} label="Beranda" active={currentView === 'home'} t={t} onClick={() => setCurrentView('home')} />
            <SidebarItem icon={<PieChart size={20} />} label="Radial" t={t} onClick={() => window.open(data?.profil?.link_radial || 'https://ai.studio/apps/0eda68f0-023c-4889-a38a-2a21d26e60af', '_blank')} />
            <SidebarItem icon={<FileText size={20} />} label="SPMB" active={currentView === 'spmb'} t={t} onClick={() => setCurrentView('spmb')} />
            <SidebarItem icon={<User size={20} />} label="Profil" active={currentView === 'profil'} t={t} onClick={() => setCurrentView('profil')} />
          </nav>
          <div className="p-4 border-t border-gray-50">
            <button 
              onClick={toggleTheme}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium text-sm active:scale-95`}
            >
              <Palette size={18} />
              Ubah Tema
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          
          {/* Notification Backdrop */}
          <AnimatePresence>
            {showNotifs && (
              <motion.div 
                key="notif-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 md:hidden" 
                onClick={() => setShowNotifs(false)}
              />
            )}
          </AnimatePresence>

          {/* Top App Bar */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between shadow-sm lg:shadow-none lg:border-b lg:border-gray-100">
            <div className="flex items-center gap-3 lg:hidden min-w-0">
              {isLoading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shadow-sm shrink-0"></div>
              ) : (
                <img 
                  src={data?.header?.logo || "https://lh3.googleusercontent.com/a/ACg8ocLjDVk3HM6HfZrRk4kJAwJveT-6ZvIEr97Ky1y_vL0a2L6Nhd4=s400-c"} 
                  alt={`Logo ${data?.header?.judul || "MIS IT Al Uswah"}`} 
                  className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="min-w-0">
                {isLoading ? (
                  <>
                    <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-24 h-3 bg-gray-200/60 rounded animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <h1 className="font-bold text-gray-800 leading-tight truncate">{data?.header?.judul || "MIS IT Al Uswah"}</h1>
                    <p className={`text-xs ${t.primaryText} font-medium transition-colors line-clamp-2`}>{data?.header?.sub_judul || "Sekolah Dasar Islam"}</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Desktop Header Title */}
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-gray-800">
                {currentView === 'home' ? 'Beranda' : currentView === 'spmb' ? 'Pendaftaran Siswa Baru' : 'Profil Sekolah'}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="lg:hidden relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
              >
                <Palette size={22} />
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifs(!showNotifs)}
                  className={`relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95 ${showNotifs ? 'bg-gray-100' : ''}`}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 ${t.secondaryBg} rounded-full border-2 border-white transition-colors`}></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div 
                      key="notif-dropdown"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden origin-top-right"
                    >
                      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                          <h4 className="font-bold text-gray-800">Notifikasi</h4>
                          <button onClick={() => setShowNotifs(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={16} className="text-gray-500"/>
                          </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(notif => (
                              <NotifItem 
                                key={notif.id}
                                notif={notif}
                                onClick={() => handleNotifClick(notif)}
                                t={t}
                              />
                            ))
                          ) : (
                            <div className="p-10 flex flex-col items-center justify-center text-center">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <BellOff size={28} className="text-gray-400" />
                              </div>
                              <p className="text-gray-800 font-semibold">Belum ada notifikasi</p>
                              <p className="text-gray-500 text-sm mt-1">Notifikasi baru akan muncul di sini.</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
                          {unreadCount > 0 ? (
                            <button onClick={markAllAsRead} className={`text-sm font-medium ${t.primaryText} hover:underline transition-colors flex items-center gap-1`}>
                              <CheckCheck size={16} /> Tandai dibaca
                            </button>
                          ) : <div></div>}
                          <button className={`text-sm font-medium ${t.primaryText} hover:underline transition-colors`}>
                            Lihat Semua
                          </button>
                        </div>
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Running Text (Global) */}
          <GlobalRunningText t={t} />

          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-w-0">
            <div className="max-w-5xl mx-auto w-full min-w-0">
              
              {/* Hero / Welcome Card */}
              <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ 
                    opacity: { duration: 0.5 },
                    y: { duration: 0.5 },
                    backgroundPosition: { duration: 15, repeat: Infinity, ease: "linear" }
                  }}
                  className={`bg-gradient-to-r ${t.gradient} bg-[length:200%_200%] rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-lg relative overflow-hidden transition-colors duration-500`}
                >
                  {/* Smooth Animated Decorative Patterns */}
                  <motion.div 
                    animate={{ 
                      x: [0, 40, 0], 
                      y: [0, -40, 0],
                      scale: [1, 1.2, 1],
                      rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                  />
                  <motion.div 
                    animate={{ 
                      x: [0, -30, 0], 
                      y: [0, 30, 0],
                      scale: [1, 1.3, 1],
                      rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -left-10 -bottom-20 w-72 h-72 bg-black/10 rounded-full blur-3xl"
                  />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      {isLoading ? (
                        <div className="w-32 h-6 bg-white/20 rounded animate-pulse mb-3"></div>
                      ) : (
                        <DateTimeAndTA tahunPelajaran={data?.sambutan?.tahun_pelajaran} />
                      )}

                      <div className="mb-2 mt-4">
                        {isLoading ? (
                          <div className="w-64 h-8 md:h-10 bg-white/20 rounded animate-pulse"></div>
                        ) : (
                          <h2 className="text-xl sm:text-2xl md:text-4xl font-extrabold leading-tight tracking-tight">
                            {renderHighlightedText(
                              data?.sambutan?.kalimat_sambutan || "Selamat datang, Ayah Bunda",
                              data?.sambutan?.highlight_text || "Ayah Bunda",
                              data?.sambutan?.highlight_color || "#fcd34d"
                            )}
                          </h2>
                        )}
                      </div>
                      <div className="mt-1">
                        {isLoading ? (
                          <div className="w-48 h-4 bg-white/20 rounded animate-pulse"></div>
                        ) : (
                          <p className="text-white/90 text-[11px] sm:text-sm md:text-base leading-relaxed w-full font-medium">
                            {data?.sambutan?.caption || "di Portal Digital MIS Islam Terpadu Al Uswah."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Quick Actions / Layanan Digital */}
              <div className="px-4 md:px-8 py-3 md:py-4 w-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 text-base md:text-lg">Layanan Digital</h3>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-5 gap-x-2 sm:gap-x-3">
                  <ActionItem icon={<Book size={20} />} label="Al Qur'an" t={t} index={0} onClick={() => setCurrentView('quran')} />
                  <ActionItem icon={<Heart size={20} />} label="Doa" t={t} index={1} onClick={() => setCurrentView('doa')} />
                  <ActionItem icon={<Calendar size={20} />} label="Kalender" t={t} index={2} onClick={() => setCurrentView('kalender')} />
                  <ActionItem icon={<Users size={20} />} label="SPMB" t={t} index={3} onClick={() => setCurrentView('spmb')} />
                  <ActionItem icon={<MessageSquare size={20} />} label="Kritik" t={t} index={4} onClick={() => setCurrentView('kritik')} />
                  <ActionItem icon={<Star size={20} />} label="Program" t={t} index={5} onClick={() => setCurrentView('program')} />
                  <ActionItem icon={<Award size={20} />} label="Ekstra" t={t} index={6} onClick={() => setCurrentView('ekstra')} />
                  <ActionItem icon={<Building size={20} />} label="Sarpras" t={t} index={7} onClick={() => setCurrentView('sarpras')} />
                </div>
              </div>

              {/* Activity Slideshow */}
              <ActivitySlideshow t={t} />

              {/* Prestasi Section */}
              <div className="py-4 w-full">
                <div className="flex items-center justify-between mb-4 px-4 md:px-8">
                  <h3 className="font-bold text-gray-800 text-lg md:text-xl">Prestasi Siswa</h3>
                </div>
                
                <div 
                  ref={prestasiRef}
                  className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-8 snap-x hide-scrollbar items-stretch"
                  onMouseEnter={() => setPrestasiPaused(true)}
                  onMouseLeave={() => setPrestasiPaused(false)}
                  onTouchStart={() => setPrestasiPaused(true)}
                  onTouchEnd={() => setPrestasiPaused(false)}
                >
                  {isLoadingPrestasi ? (
                    // Skeleton loading
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start animate-pulse">
                        <div className="w-full h-36 md:h-44 rounded-xl bg-gray-200 shrink-0"></div>
                        <div className="flex-1 flex flex-col">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mt-auto pt-1"></div>
                        </div>
                      </div>
                    ))
                  ) : prestasiList.length > 0 ? (
                    prestasiList.map((prestasi, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedPrestasi(prestasi)}
                        className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                      >
                        <div className="relative w-full h-36 md:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <img 
                            src={prestasi.thumbnail || `https://picsum.photos/seed/prestasi${idx}/400/300`} 
                            alt={prestasi.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <span>🏆</span> Prestasi
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="flex-1 flex flex-col px-1 relative">
                          <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 group-hover:text-amber-600 transition-colors pr-6">{prestasi.title}</h4>
                          <p className="text-xs text-gray-500 mt-auto pt-2 font-medium">
                            {new Date(prestasi.pubDate.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {prestasi.link && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (navigator.share && prestasi.link) {
                                  navigator.share({ title: prestasi.title, url: prestasi.link }).catch(console.error);
                                } else if (prestasi.link) {
                                  navigator.clipboard.writeText(prestasi.link);
                                  alert('Tautan disalin ke clipboard!');
                                }
                              }}
                              className="absolute right-0 top-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
                              aria-label="Bagikan"
                            >
                              <Share2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center py-8 text-gray-500 text-sm">
                      Belum ada data prestasi.
                    </div>
                  )}
                </div>
              </div>

              {/* Review Section */}
              {(isLoading || (data?.review && data.review.length > 0)) && (
                <div className="py-4 w-full">
                  <div className="flex items-center justify-between mb-4 px-4 md:px-8">
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl">Kata Wali Murid</h3>
                  </div>
                  <div 
                    ref={reviewRef}
                    className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-8 snap-x hide-scrollbar items-stretch"
                    onMouseEnter={() => setReviewPaused(true)}
                    onMouseLeave={() => setReviewPaused(false)}
                    onTouchStart={() => setReviewPaused(true)}
                    onTouchEnd={() => setReviewPaused(false)}
                  >
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="w-[280px] md:w-[320px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col snap-start animate-pulse">
                          <div className="flex gap-1 mb-3">
                            {Array.from({length: 5}).map((_, i) => (
                              <div key={i} className="w-4 h-4 bg-gray-200 rounded-full"></div>
                            ))}
                          </div>
                          <div className="flex-1 space-y-2 mb-5">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      data.review.map((item, idx) => {
                        const rating = parseInt(item.rating) || 5;
                        return (
                          <div key={idx} className="w-[280px] md:w-[320px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col snap-start">
                            <div className="flex gap-1 mb-3">
                              {Array.from({length: 5}).map((_, i) => (
                                <Star key={i} size={16} className={i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                              ))}
                            </div>
                            <p className="text-sm text-gray-700 italic mb-5 line-clamp-4 flex-1">"{item.komentar}"</p>
                            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50">
                              <img 
                                src={item.foto || `https://picsum.photos/seed/user${idx}/100/100`} 
                                alt={item.nama} 
                                className="w-10 h-10 rounded-full object-cover bg-gray-100"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h5 className="font-bold text-gray-800 text-sm">{item.nama}</h5>
                                <p className="text-[11px] text-gray-500">{item.peran}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Optional Section */}
              {(isLoadingOptional || (optionalSection && optionalSection.status && optionalSection.data.length > 0)) && (
                <div className="py-4 w-full">
                  <div className="flex items-center justify-between mb-4 px-4 md:px-8">
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl">
                      {isLoadingOptional ? <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div> : optionalSection?.title}
                    </h3>
                  </div>
                  <div 
                    ref={optionalRef}
                    className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-8 snap-x hide-scrollbar items-stretch"
                    onMouseEnter={() => setOptionalPaused(true)}
                    onMouseLeave={() => setOptionalPaused(false)}
                    onTouchStart={() => setOptionalPaused(true)}
                    onTouchEnd={() => setOptionalPaused(false)}
                  >
                    {isLoadingOptional ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start animate-pulse">
                          <div className="w-full h-36 md:h-44 rounded-xl bg-gray-200 shrink-0"></div>
                          <div className="flex-1 flex flex-col justify-between p-1">
                            <div className="space-y-2">
                              <div className="w-20 h-3 bg-gray-200 rounded"></div>
                              <div className="w-full h-4 bg-gray-200 rounded"></div>
                              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      optionalSection?.data.map((item, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedNews(item)}
                          className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start cursor-pointer hover:shadow-md transition-shadow group"
                        >
                          <div className="relative w-full h-36 md:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            {item.thumbnail ? (
                              <img 
                                src={item.thumbnail} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <FileText className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-gray-700 shadow-sm">
                              {formatDate(item.pubDate)}
                            </div>
                          </div>
                          
                          <div className="flex-1 flex flex-col p-1">
                            <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors">
                              {item.title}
                            </h4>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Video Terbaru Section */}
              {(isLoading || (data?.video && data.video.filter(item => {
                const url = item.url_youtube;
                if (!url) return false;
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = url.match(regExp);
                return (match && match[2].length === 11);
              }).length > 0)) && (
                <div className="py-4 w-full">
                  <div className="flex items-center justify-between mb-4 px-4 md:px-8">
                    <h3 className="font-bold text-gray-800 text-lg md:text-xl">Video Terbaru</h3>
                  </div>
                  <div 
                    ref={videoRef}
                    className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-8 snap-x hide-scrollbar items-stretch"
                    onMouseEnter={() => setVideoPaused(true)}
                    onMouseLeave={() => setVideoPaused(false)}
                    onTouchStart={() => setVideoPaused(true)}
                    onTouchEnd={() => setVideoPaused(false)}
                  >
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start animate-pulse">
                          <div className="w-full h-36 md:h-44 rounded-xl bg-gray-200 shrink-0"></div>
                          <div className="flex-1 flex flex-col">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      data.video.filter(item => {
                        const url = item.url_youtube;
                        if (!url) return false;
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                        const match = url.match(regExp);
                        return (match && match[2].length === 11);
                      }).map((item, idx) => {
                        // Extract YouTube ID to get high-res thumbnail if not provided
                        const getYouTubeId = (url: string) => {
                          if (!url) return null;
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = url.match(regExp);
                          return (match && match[2].length === 11) ? match[2] : null;
                        };
                        const videoId = getYouTubeId(item.url_youtube);
                        const thumbnailUrl = item.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);

                        return (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedVideo(item)}
                            className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start cursor-pointer hover:shadow-md transition-shadow group"
                          >
                            <div className="relative w-full h-36 md:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              {thumbnailUrl ? (
                                <img 
                                  src={thumbnailUrl} 
                                  alt={item.judul} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                  <Play size={32} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-red-600">
                                  <Play size={24} className="ml-1" />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col">
                              <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{item.judul}</h4>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* News Section / Kabar Terbaru */}
              <div className="px-4 md:px-8 py-2 md:py-4 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg md:text-xl">Kabar Terbaru</h3>
                  <button onClick={() => setCurrentView('news')} className={`text-sm ${t.primaryText} font-medium hover:underline transition-colors`}>Lihat Semua</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoadingNews ? (
                    // Skeleton loading
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl shadow-sm flex gap-3 items-center border border-gray-100 animate-pulse">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))
                  ) : newsList.length > 0 ? (
                    newsList.slice(0, 4).map((news, idx) => (
                      <NewsCard 
                        key={idx}
                        title={news.title}
                        date={new Date(news.pubDate.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        image={news.thumbnail || `https://picsum.photos/seed/news${idx}/400/300`}
                        index={idx}
                        onClick={() => setSelectedNews(news)}
                        link={news.link}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                      Gagal memuat berita terbaru.
                    </div>
                  )}
                </div>
              </div>

              {/* Minimalist Footer Section */}
              {(isLoading || data?.footer) && (
                <footer className="bg-white border-t border-gray-200 mt-auto pt-10 pb-24 md:pb-10 px-6 md:px-12 w-full overflow-hidden">
                  {isLoading ? (
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 w-full animate-pulse">
                      <div className="flex flex-col items-center md:items-start w-full">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                      </div>
                      <div className="flex flex-col items-center md:items-end gap-4 w-full">
                        <div className="h-10 bg-gray-200 rounded-full w-40"></div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                      <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
                        <h3 className="text-lg font-bold text-gray-800">{data?.header?.judul || "MIS IT Al Uswah"}</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm">
                          {data?.footer?.teks_cta || "Mencetak generasi Qur'ani, Mandiri, dan Berprestasi."}
                        </p>
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-4 w-full">
                        {/* CTA Button */}
                        <a 
                          href={`https://wa.me/${data.footer.no_wa}?text=${encodeURIComponent(data.footer.pesan_wa || 'Halo')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 px-5 py-2.5 ${t.primaryBg} text-white rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap`}
                        >
                          <MessageCircle size={18} />
                          Hubungi Kami
                        </a>

                        {/* Social Media */}
                        <div className="flex items-center gap-3">
                          {data.footer.facebook && (
                            <a href={data.footer.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                              <Facebook size={20} />
                            </a>
                          )}
                          {data.footer.instagram && (
                            <a href={data.footer.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                              <Instagram size={20} />
                            </a>
                          )}
                          {data.footer.youtube && (
                            <a href={data.footer.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">
                              <Youtube size={20} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address & Copyright */}
                  <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 w-full">
                    {isLoading ? (
                      <>
                        <div className="h-4 bg-gray-200 rounded w-full md:w-1/2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start md:items-center gap-2 text-left w-full md:w-auto">
                          <MapPin size={14} className="shrink-0 mt-0.5 md:mt-0" />
                          <span className="flex-1 leading-relaxed">{data?.footer?.alamat || data?.profil?.alamat}</span>
                        </div>
                        <p className="shrink-0 w-full text-center md:text-right md:w-auto">© {new Date().getFullYear()} {data?.header?.judul || "MIS IT Al Uswah"}.</p>
                      </>
                    )}
                  </div>
                </footer>
              )}
              {(!isLoading && !data?.footer) && <div className="h-28 md:h-8 shrink-0" />}

            </div>
          </main>

        </div>

        {/* Bottom Navigation Bar (Mobile & Tablet) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-2 md:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-around items-center shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <BottomNavItem icon={<Home size={24} />} label="Beranda" active={currentView === 'home'} t={t} onClick={() => setCurrentView('home')} />
          <BottomNavItem icon={<PieChart size={24} />} label="Radial" t={t} onClick={() => window.open(data?.profil?.link_radial || 'https://ai.studio/apps/0eda68f0-023c-4889-a38a-2a21d26e60af', '_blank')} />
          <BottomNavItem icon={<FileText size={24} />} label="SPMB" active={currentView === 'spmb'} t={t} onClick={() => setCurrentView('spmb')} />
          <BottomNavItem icon={<User size={24} />} label="Profil" active={currentView === 'profil'} t={t} onClick={() => setCurrentView('profil')} />
        </nav>

        {/* AI Chatbot */}
        <Chatbot t={t} />

        {/* Notification Detail Modal */}
        <AnimatePresence>
          {selectedNotif && (
            <NotificationModal 
              notif={selectedNotif} 
              onClose={() => setSelectedNotif(null)} 
              t={t} 
            />
          )}
        </AnimatePresence>

        {/* News Detail Modal */}
        <AnimatePresence>
          {selectedNews && (
            <NewsDetailView 
              t={t}
              news={selectedNews}
              onBack={() => setSelectedNews(null)}
            />
          )}
        </AnimatePresence>

        {/* Prestasi Detail Modal (Using NewsDetailView format) */}
        <AnimatePresence>
          {selectedPrestasi && (
            <NewsDetailView 
              t={t}
              news={selectedPrestasi}
              onBack={() => setSelectedPrestasi(null)}
              title="Detail Prestasi"
            />
          )}
        </AnimatePresence>

        {/* Video Detail Modal */}
        <AnimatePresence>
          {selectedVideo && (
            <VideoModal 
              video={selectedVideo}
              onClose={() => setSelectedVideo(null)}
            />
          )}
        </AnimatePresence>

        {/* Sub-Views (Routing) */}
        <AnimatePresence>
          {currentView !== 'home' && (
            <motion.div
              key="subview-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
            >
              <ErrorBoundary>
                <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><div className={`w-8 h-8 border-4 border-t-transparent ${t.primaryText} rounded-full animate-spin border-opacity-50`}></div></div>}>
                  {currentView === 'quran' && <QuranView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'doa' && <DoaView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'kalender' && <KalenderView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'spmb' && <SPMBView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'kritik' && <KritikView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'program' && <ProgramView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'ekstra' && <EkstraView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'sarpras' && <SarprasView t={t} onBack={() => setCurrentView('home')} />}
                  {currentView === 'news' && <NewsListView t={t} newsList={newsList} onBack={() => setCurrentView('home')} onSelectNews={setSelectedNews} />}
                  {currentView === 'profil' && <ProfilView t={t} onBack={() => setCurrentView('home')} />}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
