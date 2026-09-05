import React, { useState, Suspense, useEffect } from 'react';
import { 
  Bell, Home, Compass, Grid, User, GraduationCap, FileText, 
  Wallet, CalendarCheck, MessageSquare, BookOpen, X, Palette,
  CheckCheck, BellOff, Book, Heart, Calendar, Users, Star, Award, Building, PieChart,
  Play, Facebook, Instagram, Youtube, MapPin, MessageCircle, Share2,
  ClipboardCheck, Handshake, ChevronUp, AlertCircle, Image as ImageIcon, Download, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from './types';
import { themeConfig } from './theme';
import { DateTimeAndTA } from './components/DateTimeAndTA';
import { ActivitySlideshow } from './components/ActivitySlideshow';
import { NotificationModal, NotifItem } from './components/NotificationComponents';
import { SidebarItem, ActionItem, BottomNavItem, RunningText } from './components/UIComponents';
import { LazyImage } from './components/LazyImage';
import { GlobalRunningText } from './components/GlobalRunningText';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './context/ThemeContext';
import { useData } from './context/DataContext';
import { getSpmbExternalUrl } from './utils/spmbUtils';
import { fetchSheetJsonp } from './utils/googleSheets';
import { AbsensiView } from './views/AbsensiView';
import { AffiliasiView } from './views/AffiliasiView';
import { YaumiyahView } from './views/YaumiyahView';
import { NewsDetailView } from './views/NewsDetailView';
import { NotificationCenterView } from './views/NotificationCenterView';
import { VideoModal } from './components/VideoModal';
import { ReviewSection } from './components/ReviewSection';
import { ChatbotView } from './views/ChatbotView';
import ReloadPrompt from './components/ReloadPrompt';

// Lazy load views
const QuranView = React.lazy(() => import('./views/QuranView').then(m => ({ default: m.QuranView })));
const DoaView = React.lazy(() => import('./views/DoaView').then(m => ({ default: m.DoaView })));
const KalenderView = React.lazy(() => import('./views/KalenderView').then(m => ({ default: m.KalenderView })));
const SPMBView = React.lazy(() => import('./views/SPMBView').then(m => ({ default: m.SPMBView })));
const SPMBModal = React.lazy(() => import('./components/SPMBModal').then(m => ({ default: m.SPMBModal })));
const KritikView = React.lazy(() => import('./views/KritikView').then(m => ({ default: m.KritikView })));
const ProgramView = React.lazy(() => import('./views/ProgramView').then(m => ({ default: m.ProgramView })));
const EkstraView = React.lazy(() => import('./views/EkstraView').then(m => ({ default: m.EkstraView })));
const SarprasView = React.lazy(() => import('./views/SarprasView').then(m => ({ default: m.SarprasView })));
const NewsListView = React.lazy(() => import('./views/NewsListView').then(m => ({ default: m.NewsListView })));
const ProfilView = React.lazy(() => import('./views/ProfilView').then(m => ({ default: m.ProfilView })));
const RadialView = React.lazy(() => import('./components/RadialView'));
const ReviewView = React.lazy(() => import('./views/ReviewView').then(m => ({ default: m.ReviewView })));
const ReviewListView = React.lazy(() => import('./views/ReviewListView').then(m => ({ default: m.ReviewListView })));
const GaleriView = React.lazy(() => import('./views/GaleriView').then(m => ({ default: m.GaleriView })));
const KelulusanView = React.lazy(() => import('./views/KelulusanView').then(m => ({ default: m.KelulusanView })));

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

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 menit

export default function App() {
  const { theme: t, themeName, setThemeName } = useTheme();
  const { data, isLoading, error, refreshData } = useData();
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'quran' | 'doa' | 'kalender' | 'spmb' | 'spmb-form' | 'kritik' | 'program' | 'ekstra' | 'sarpras' | 'news' | 'profil' | 'absensi' | 'affiliasi' | 'yaumiyah' | 'radial' | 'review' | 'review-list' | 'galeri' | 'chatbot' | 'notification-center' | 'kelulusan'>(() => {
    try {
      const lastActiveStr = localStorage.getItem('lastActiveTime');
      const savedView = localStorage.getItem('currentView');
      const now = Date.now();

      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (!isNaN(lastActive) && now - lastActive > INACTIVITY_TIMEOUT_MS) {
          // Melebihi batas inaktif 15 menit -> reset ke Beranda
          localStorage.setItem('currentView', 'home');
          localStorage.setItem('lastActiveTime', now.toString());
          return 'home';
        }
      }

      localStorage.setItem('lastActiveTime', now.toString());
      return (savedView as any) || 'home';
    } catch (e) {
      return 'home';
    }
  });
  const [showExitModal, setShowExitModal] = useState(false);
  const isExiting = React.useRef(false);

  // Bagian Instalasi PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Ambil dari global (index.html) jika event terpicu sangat cepat sebelum React siap
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    // Dengarkan event sebelum prompt instalasi muncul (Jika telat tertangkap)
    const handleBeforeInstallPrompt = (e: Event) => {
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setDeferredPrompt(null);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    (window as any).deferredPWAInstallPrompt = null;
  };

  useEffect(() => {
    try {
      localStorage.setItem('currentView', currentView);
      localStorage.setItem('lastActiveTime', Date.now().toString());
    } catch (e) {}
  }, [currentView]);

  // Pantau interaksi aktif pengguna untuk memperbarui lastActiveTime (dibatasi tiap 30 detik)
  useEffect(() => {
    let lastThrottledTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 30000) {
        lastThrottledTime = now;
        try {
          localStorage.setItem('lastActiveTime', now.toString());
        } catch (e) {}
      }
    };

    window.addEventListener('pointerdown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, []);

  // Pantau saat aplikasi kembali aktif dari background / layar kunci
  useEffect(() => {
    const checkInactivityAndReset = () => {
      try {
        const lastActiveStr = localStorage.getItem('lastActiveTime');
        const now = Date.now();
        if (lastActiveStr) {
          const lastActive = parseInt(lastActiveStr, 10);
          if (!isNaN(lastActive) && now - lastActive > INACTIVITY_TIMEOUT_MS) {
            // Sudah inaktif > 15 menit -> reset ke Beranda & bersihkan state modal
            setCurrentView('home');
            localStorage.setItem('currentView', 'home');
            setSelectedNews(null);
            setSelectedPrestasi(null);
            setSelectedVideo(null);
            setSelectedNotif(null);
            setShowNotifs(false);
            setShowExitModal(false);
            window.history.replaceState({ view: 'home', appState: true }, '', '/');
          }
        }
        localStorage.setItem('lastActiveTime', now.toString());
      } catch (e) {}
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivityAndReset();
      } else {
        try {
          localStorage.setItem('lastActiveTime', Date.now().toString());
        } catch (e) {}
      }
    };

    const handlePageShow = () => {
      checkInactivityAndReset();
    };

    const handleFocus = () => {
      checkInactivityAndReset();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!window.history.state || !window.history.state.appState) {
      window.history.replaceState({ view: 'exit', appState: true }, '', '');
      window.history.pushState({ view: currentView, appState: true }, '', `#${currentView}`);
    }
  }, []);

  const handleNavigate = (view: typeof currentView) => {
    if (view !== currentView) {
      window.history.pushState({ view, appState: true }, '', view === 'home' ? '/' : `#${view}`);
      setCurrentView(view);
    }
  };

  const handleBack = () => {
    if (currentView === 'spmb-form') {
      handleNavigate('spmb');
    } else if (currentView !== 'home') {
      handleNavigate('home');
    } else {
      window.history.back();
    }
  };

  const confirmExit = () => {
    isExiting.current = true;
    setShowExitModal(false);
    window.history.go(-2);
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };
  const [showAllServices, setShowAllServices] = useState(false);

  const { scrollRef: newsRef, setIsPaused: setNewsPaused } = useAutoScroll(3800);
  const { scrollRef: prestasiRef, setIsPaused: setPrestasiPaused } = useAutoScroll(3500);
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

  // State for Layanan Digital Order
  const [layananDigitalOrder, setLayananDigitalOrder] = useState<string[]>(() => {
    const cached = localStorage.getItem('layananDigitalOrder');
    return cached ? JSON.parse(cached) : [];
  });
  const [isLoadingLayananDigital, setIsLoadingLayananDigital] = useState(!localStorage.getItem('layananDigitalOrder'));
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isExiting.current) return;
      
      // If any modal is open, close it and stay on the current view
      if (selectedNews || selectedPrestasi || selectedVideo || selectedNotif) {
        setSelectedNews(null);
        setSelectedPrestasi(null);
        setSelectedVideo(null);
        setSelectedNotif(null);
        // Push the state back so we don't lose the history
        window.history.pushState({ view: currentView, appState: true }, '', currentView === 'home' ? '/' : `#${currentView}`);
        return;
      }

      if (event.state && event.state.view === 'exit') {
        if (currentView === 'spmb-form') {
          window.history.replaceState({ view: 'exit', appState: true }, '', '');
          window.history.pushState({ view: 'spmb', appState: true }, '', '#spmb');
          setCurrentView('spmb');
        } else if (currentView !== 'home') {
          window.history.replaceState({ view: 'exit', appState: true }, '', '');
          window.history.pushState({ view: 'home', appState: true }, '', '#home');
          setCurrentView('home');
        } else {
          setShowExitModal(true);
          window.history.pushState({ view: currentView, appState: true }, '', `#${currentView}`);
        }
      } else if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, selectedNews, selectedPrestasi, selectedVideo, selectedNotif]);

  // Reset ke beranda ketika notifikasi diklik (baik dari background maupun fresh launch via OneSignal event)
  useEffect(() => {
    const handleNotificationClick = () => {
      setCurrentView('home');
      try {
        localStorage.setItem('currentView', 'home');
        localStorage.setItem('lastActiveTime', Date.now().toString());
        window.history.replaceState({ view: 'home', appState: true }, '', '/');
      } catch (e) {}
      // Reset juga modal/selected states jika ada yang terbuka agar benar-benar berada di beranda utama
      setSelectedNews(null);
      setSelectedPrestasi(null);
      setSelectedVideo(null);
      setSelectedNotif(null);
      setShowNotifs(false);
      setShowExitModal(false);
    };
    window.addEventListener('notification-clicked', handleNotificationClick);
    return () => window.removeEventListener('notification-clicked', handleNotificationClick);
  }, []);

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
      script.src = `https://www.misitaluswah.sch.id/feeds/posts/default/-/Artikel?alt=json-in-script&callback=${callbackName}`;
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
        const SHEET_ID = '1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s';
        const jsonpData = await fetchSheetJsonp(SHEET_ID, 'Opsional');
        if (jsonpData && jsonpData.table && jsonpData.table.rows && jsonpData.table.rows.length > 0) {
          const row0 = jsonpData.table.rows[0];
          if (row0 && row0.c) {
            const title = row0.c[0]?.v ? String(row0.c[0].v).trim() : '';
            const url = row0.c[1]?.v ? String(row0.c[1].v).trim() : '';
            const statusVal = row0.c[2]?.v;
            const status = statusVal === true || String(statusVal).toLowerCase() === 'true' || String(statusVal) === '1';

            if (title && url && status) {
              fetchOptionalData(url, title);
            } else {
              setIsLoadingOptional(false);
            }
          } else {
            setIsLoadingOptional(false);
          }
        } else {
          setIsLoadingOptional(false);
        }
      } catch (error) {
        setIsLoadingOptional(false);
      }
    };
    
    const fetchLayananDigital = async () => {
      try {
        const SHEET_ID = '1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s';
        const jsonpData = await fetchSheetJsonp(SHEET_ID, 'Layanan Digital');
        if (jsonpData && jsonpData.table && jsonpData.table.rows) {
          const orderedServices: {name: string, order: number}[] = [];
          jsonpData.table.rows.forEach((row: any) => {
            if (!row.c) return;
            const orderVal = row.c[0] ? (typeof row.c[0].v === 'number' ? row.c[0].v : parseInt(row.c[0].f || row.c[0].v)) : null;
            const nameVal = row.c[1]?.v ? String(row.c[1].v).trim() : '';
            if (orderVal !== null && !isNaN(orderVal) && nameVal) {
              orderedServices.push({ name: nameVal, order: orderVal });
            }
          });

          if (orderedServices.length > 0) {
            orderedServices.sort((a, b) => a.order - b.order);
            const newOrder = orderedServices.map(s => s.name);
            setLayananDigitalOrder(newOrder);
            localStorage.setItem('layananDigitalOrder', JSON.stringify(newOrder));
          }
        }
      } catch (error) {
        // Fallback silently if offline or blocked, preserving default/cached order
      } finally {
        setIsLoadingLayananDigital(false);
      }
    };
    
    fetchNews();
    fetchPrestasi();
    fetchOptionalConfig();
    fetchLayananDigital();
  }, [retryTrigger]);

  // Sync profil data ke localStorage untuk modul Cek Kelulusan tanpa perlu request CSV terpisah
  useEffect(() => {
    if (data?.profil) {
      if (data.profil.nama_sekolah) {
        localStorage.setItem('kelulusan_schoolName', data.profil.nama_sekolah);
      }
      if (data.profil.visi) {
        localStorage.setItem('kelulusan_schoolVisi', data.profil.visi);
      }
      if (data.profil.Logo_Sekolah) {
        localStorage.setItem('kelulusan_logoUrl', data.profil.Logo_Sekolah);
      }
    }
  }, [data?.profil]);

  useEffect(() => {
    if (data?.header) {
      // Update document title
      const appName = data.header.nama_aplikasi || data.header['Nama Aplikasi'] || data.header.nama || data.header._row5 || data.header.judul || 'MIS IT Al Uswah';
      document.title = appName;
    }
  }, [data?.header]);

  // Data Notifikasi
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const combinedNotifs: Notification[] = [];

    // Add News
    if (newsList && newsList.length > 0) {
      newsList.forEach((news, idx) => {
        let pubDate = Date.now();
        try { pubDate = new Date(news.pubDate.replace(' ', 'T')).getTime(); } catch(e) {}
        
        combinedNotifs.push({
          id: `news-${news.link}`,
          type: 'news',
          title: 'Berita Baru',
          desc: news.title,
          fullDesc: news.title,
          time: new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          unread: true,
          image: news.thumbnail,
          linkType: 'news',
          linkData: news,
          timestamp: pubDate
        });
      });
    }

    // Add Prestasi
    if (prestasiList && prestasiList.length > 0) {
      prestasiList.forEach((prestasi, idx) => {
        let pubDate = Date.now();
        try { pubDate = new Date(prestasi.pubDate.replace(' ', 'T')).getTime(); } catch(e) {}

        combinedNotifs.push({
          id: `prestasi-${prestasi.link}`,
          type: 'prestasi',
          title: 'Prestasi Baru',
          desc: prestasi.title,
          fullDesc: prestasi.title,
          time: new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          unread: true,
          image: prestasi.thumbnail,
          linkType: 'prestasi',
          linkData: prestasi,
          timestamp: pubDate
        });
      });
    }

    // Add Video
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
            unread: true,
            image: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            linkType: 'video',
            linkData: video,
            timestamp: videoTime
          });
        }
      });
    }

    // Add Karya Siswa
    if (data?.karyaSiswa && data.karyaSiswa.length > 0) {
      data.karyaSiswa.forEach((karya: any, idx: number) => {
        let pubDate = Date.now();
        try { pubDate = new Date(karya.pubDate?.replace(' ', 'T') || karya.timestamp).getTime(); } catch(e) {}

        combinedNotifs.push({
          id: `karya-${karya.link || idx}`,
          type: 'karya',
          title: 'Karya Siswa Baru',
          desc: karya.title || karya.judul,
          fullDesc: karya.title || karya.judul,
          time: new Date(pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          unread: true,
          image: karya.thumbnail || karya.urlGambar,
          linkType: 'karya',
          linkData: karya,
          timestamp: pubDate
        });
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

    setNotifications(finalNotifs);
  }, [newsList, prestasiList, data?.video, data?.karyaSiswa]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const toggleTheme = () => {
    const themes: ('emerald' | 'cyan' | 'pastelPink' | 'pastelMint' | 'indigo' | 'amber' | 'violet' | 'slate' | 'instagram' | 'youtube')[] = [
      'emerald', 'cyan', 'pastelPink', 'pastelMint', 'indigo', 'amber', 'violet', 'slate', 'instagram', 'youtube'
    ];
    const currentIndex = themes.indexOf(themeName as any);
    setThemeName(themes[(currentIndex + 1) % themes.length]);
  };

  const handleNotifClick = (notif: Notification) => {
    // Tandai sebagai dibaca
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
    
    const readNotifsStr = localStorage.getItem('readNotifs');
    let readNotifs: string[] = readNotifsStr ? JSON.parse(readNotifsStr) : [];
    if (!readNotifs.includes(notif.id)) {
      readNotifs.push(notif.id);
      // Keep only the last 50 read notifications to prevent localStorage bloat
      if (readNotifs.length > 50) {
        readNotifs = readNotifs.slice(readNotifs.length - 50);
      }
      localStorage.setItem('readNotifs', JSON.stringify(readNotifs));
    }

    setShowNotifs(false); // Tutup dropdown

    // Handle navigation based on linkType
    if (notif.linkType === 'news') {
      setSelectedNews(notif.linkData);
    } else if (notif.linkType === 'prestasi') {
      setSelectedPrestasi(notif.linkData);
    } else if (notif.linkType === 'karya') {
      setSelectedNews(notif.linkData);
    } else if (notif.linkType === 'video') {
      setSelectedVideo(notif.linkData);
    } else {
      setSelectedNotif(notif);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    let allIds = notifications.map(n => n.id);
    // Keep only the last 50 read notifications
    if (allIds.length > 50) {
      allIds = allIds.slice(allIds.length - 50);
    }
    localStorage.setItem('readNotifs', JSON.stringify(allIds));
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

  const allServices = [
    { id: 'quran', label: "Al Qur'an", icon: <Book size={20} /> },
    { id: 'doa', label: "Doa", icon: <Heart size={20} /> },
    { id: 'yaumiyah', label: "Yaumiyah", icon: <CheckCheck size={20} /> },
    { id: 'kalender', label: "Kalender", icon: <Calendar size={20} /> },
    { id: 'spmb', label: "SPMB", icon: <Users size={20} /> },
    { id: 'kritik', label: "Kritik", sheetLabel: "Kritik & Saran", icon: <MessageSquare size={20} /> },
    { id: 'program', label: "Program", icon: <Star size={20} /> },
    { id: 'ekstra', label: "Ekstra", icon: <Award size={20} /> },
    { id: 'sarpras', label: "Sarpras", icon: <Building size={20} /> },
    { id: 'absensi', label: "Absensi", icon: <ClipboardCheck size={20} /> },
    { id: 'affiliasi', label: "Affiliasi", icon: <Handshake size={20} /> },
    { id: 'review', label: "Review", icon: <Star size={20} /> },
    { id: 'galeri', label: "Galeri", icon: <ImageIcon size={20} /> },
    { id: 'kelulusan', label: "Cek Kelulusan", sheetLabel: "Kelulusan Kelas 6", icon: <GraduationCap size={20} /> },
    { id: 'radial', label: "Radial", icon: <PieChart size={20} /> },
  ];

  let orderedServices = layananDigitalOrder.length > 0 
    ? layananDigitalOrder.map(name => {
        const service = allServices.find(s => s.label === name || s.sheetLabel === name);
        if (service) {
          return { ...service, label: name }; // Use the name from the spreadsheet
        }
        return null;
      }).filter(Boolean) as typeof allServices
    : allServices;

  // Auto-append Cek Kelulusan if not present
  if (!orderedServices.some(s => s.id === 'kelulusan')) {
    orderedServices = [...orderedServices, { id: 'kelulusan', label: "Cek Kelulusan", icon: <GraduationCap size={20} /> }];
  }

  const getServiceTitle = (id: string) => orderedServices.find(s => s.id === id)?.label;

  const isStandaloneView = currentView === 'radial' || currentView === 'spmb';

  return (
    <div className="fixed inset-0 bg-gray-200 w-full flex justify-center overflow-hidden">
      {/* Main Container */}
      <div className="w-full h-full bg-gray-50 relative overflow-hidden flex flex-col lg:flex-row font-sans transition-colors duration-300">
        
        {/* Sidebar (Desktop Only) */}
        {!isStandaloneView && (
          <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col z-40 shadow-sm shrink-0">
            <div className="p-6 flex items-center gap-3 border-b border-gray-50">
              {isLoading ? (
                <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse shrink-0"></div>
              ) : (
                <img 
                  src={formatImageUrl(data?.header?.logo) || "https://drive.google.com/uc?export=view&id=1gEHwUNqyq_qJridKdi7GtGVdOvrT2lKB"}
                  alt={`Logo ${data?.header?.judul || "MIS IT Al Uswah"}`}
                  className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                  loading="lazy"
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
                    <h1 className="font-bold text-gray-800 leading-tight truncate">{data?.header?.judul || "MIS IT Al Uswah"}</h1>
                    <p className={`text-xs ${t.primaryText} font-medium transition-colors line-clamp-2`}>{data?.header?.sub_judul || "Portal Sekolah"}</p>
                  </>
                )}
              </div>
            </div>
            <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
              {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 font-bold text-white shadow-sm hover:opacity-90 transition-opacity ${t.primaryBg}`}
                >
                  <Download size={20} className="animate-bounce" />
                  <span>Instal Aplikasi</span>
                </button>
              )}
              <SidebarItem icon={<Home size={20} />} label="Beranda" active={currentView === 'home'} t={t} onClick={() => handleNavigate('home')} />
              <SidebarItem icon={<PieChart size={20} />} label="Radial" active={(currentView as string) === 'radial'} t={t} onClick={() => handleNavigate('radial')} />
              <SidebarItem icon={<FileText size={20} />} label="SPMB" active={(currentView as string) === 'spmb'} t={t} onClick={() => handleNavigate('spmb')} />
              <SidebarItem icon={<User size={20} />} label="Profil" active={currentView === 'profil'} t={t} onClick={() => handleNavigate('profil')} />
              <SidebarItem icon={<MessageCircle size={20} />} label="Tanya AI" active={currentView === 'chatbot'} t={t} onClick={() => handleNavigate('chatbot')} />
            </nav>
          </aside>
        )}

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
          {!isStandaloneView && (
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between shadow-sm lg:shadow-none lg:border-b lg:border-gray-100">
            <div className="flex items-center gap-3 lg:hidden min-w-0">
              {isLoading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shadow-sm shrink-0"></div>
              ) : (
                <img 
                  src={formatImageUrl(data?.header?.logo) || "https://drive.google.com/uc?export=view&id=1gEHwUNqyq_qJridKdi7GtGVdOvrT2lKB"}
                  alt={`Logo ${data?.header?.judul || "MIS IT Al Uswah"}`}
                  className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                  loading="lazy"
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
                {currentView === 'home' ? 'Beranda' : (currentView as string) === 'spmb' ? 'Pendaftaran Siswa Baru' : 'Profil Sekolah'}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Install PWA Button (Mobile Top Bar) */}
              {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className={`relative flex items-center justify-center p-2 rounded-full transition-colors active:scale-95 text-white shadow-md ${t.primaryBg}`}
                  title="Instal Aplikasi"
                >
                  <Download size={18} className="animate-bounce" />
                </button>
              )}

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                title="Ubah Tema"
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
                    <span className={`absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white ${t.secondaryBg} rounded-full border-2 border-white px-1 transition-colors`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
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
                            notifications.slice(0, 10).map((notif, idx) => (
                              <NotifItem 
                                key={`${notif.id}-${idx}`}
                                notif={notif}
                                onClick={() => {
                                  handleNotifClick(notif);
                                  setShowNotifs(false);
                                }}
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
                          <button 
                            onClick={() => {
                              setShowNotifs(false);
                              handleNavigate('notification-center');
                            }}
                            className={`text-sm font-bold ${t.primaryText} hover:opacity-80 transition-opacity`}
                          >
                            Lihat Semua
                          </button>
                        </div>
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>
          )}

          {/* Running Text (Global) */}
          {!isStandaloneView && <GlobalRunningText t={t} />}

          {/* Main Scrollable Content */}
          <main id="main-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-w-0">
            {error && !data ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Data</h2>
                <p className="text-gray-600 mb-6 max-w-md">{error}</p>
                <button 
                  onClick={() => {
                    refreshData();
                    setRetryTrigger(prev => prev + 1);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-white font-medium ${t.primaryBg} hover:opacity-90 transition-opacity`}
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
            <div className="max-w-[1600px] mx-auto w-full min-w-0">
              
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
                  {isLoadingLayananDigital && layananDigitalOrder.length === 0 ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <div key={`skeleton-service-${idx}`} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-200 animate-pulse"></div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))
                  ) : (
                    <>
                      {orderedServices.map((service, index) => {
                        // Show first 7 items + 'Lainnya' button on mobile, show all on desktop or if expanded
                        const isHiddenOnMobile = index >= 7 && !showAllServices;
                        
                        return (
                          <ActionItem 
                            key={`${service.id}-${index}`}
                            className={isHiddenOnMobile ? "hidden md:flex" : "flex"} 
                            icon={service.icon} 
                            label={service.label} 
                            t={t} 
                            index={index} 
                            isHighlighted={service.id === 'spmb'}
                            badge={service.id === 'spmb' ? 'New' : ''}
                            onClick={() => handleNavigate(service.id as any)} 
                          />
                        );
                      })}
                      
                      {/* Toggle Button for Mobile */}
                      <ActionItem 
                        className="md:hidden" 
                        icon={showAllServices ? <ChevronUp size={20} /> : <Grid size={20} />} 
                        label={showAllServices ? "Lebih Sedikit" : "Lainnya"} 
                        t={t} 
                        index={12} 
                        onClick={() => setShowAllServices(!showAllServices)} 
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Kabar Terbaru / News Slide Section */}
              <div className="py-4 w-full">
                <div className="flex items-center justify-between mb-4 px-4 md:px-8">
                  <h3 className="font-bold text-gray-800 text-lg md:text-xl">Kabar Terbaru</h3>
                  <button 
                    onClick={() => handleNavigate('news')} 
                    className={`text-sm ${t.primaryText} font-medium hover:underline transition-colors`}
                  >
                    Lihat Semua
                  </button>
                </div>
                
                <div 
                  ref={newsRef}
                  className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-8 snap-x hide-scrollbar items-stretch"
                  onMouseEnter={() => setNewsPaused(true)}
                  onMouseLeave={() => setNewsPaused(false)}
                  onTouchStart={() => setNewsPaused(true)}
                  onTouchEnd={() => setNewsPaused(false)}
                >
                  {isLoadingNews ? (
                    // Skeleton loading
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div key={`news-skeleton-${idx}`} className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start animate-pulse">
                        <div className="w-full h-36 md:h-44 rounded-xl bg-gray-200 shrink-0"></div>
                        <div className="flex-1 flex flex-col">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mt-auto pt-1"></div>
                        </div>
                      </div>
                    ))
                  ) : newsList.length > 0 ? (
                    newsList.map((news, idx) => (
                      <div 
                        key={news.link || `news-${idx}`} 
                        onClick={() => setSelectedNews(news)}
                        className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                      >
                        <div className="relative w-full h-36 md:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <LazyImage 
                            src={news.thumbnail || `https://picsum.photos/seed/news${idx}/400/300`} 
                            alt={news.title} 
                            containerClassName="w-full h-full"
                            className="group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <span>📰</span> Kabar
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="flex-1 flex flex-col px-1 relative">
                          <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 group-hover:text-emerald-600 transition-colors pr-6">
                            {news.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-auto pt-2 font-medium">
                            {new Date(news.pubDate.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {news.link && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (navigator.share && news.link) {
                                  navigator.share({ title: news.title, url: news.link }).catch(console.error);
                                } else if (news.link) {
                                  navigator.clipboard.writeText(news.link);
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
                      Belum ada kabar terbaru.
                    </div>
                  )}
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
                      <div key={`prestasi-skeleton-${idx}`} className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start animate-pulse">
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
                        key={prestasi.link || `prestasi-${idx}`} 
                        onClick={() => setSelectedPrestasi(prestasi)}
                        className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                      >
                        <div className="relative w-full h-36 md:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <LazyImage 
                            src={prestasi.thumbnail || `https://picsum.photos/seed/prestasi${idx}/400/300`} 
                            alt={prestasi.title} 
                            containerClassName="w-full h-full"
                            className="group-hover:scale-105 transition-transform duration-500"
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
              <ReviewSection data={data?.review || []} isLoading={isLoading} onViewAll={() => handleNavigate('review-list')} />

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
                        <div key={`optional-skeleton-${idx}`} className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start animate-pulse">
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
                          key={item.link || `optional-${idx}`} 
                          onClick={() => setSelectedNews(item)}
                          className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start cursor-pointer hover:shadow-md transition-shadow group"
                        >
                          <div className="relative w-full h-36 md:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            {item.thumbnail ? (
                              <LazyImage 
                                src={item.thumbnail} 
                                alt={item.title} 
                                containerClassName="w-full h-full"
                                className="group-hover:scale-105 transition-transform duration-500"
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
                        <div key={`video-skeleton-${idx}`} className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start animate-pulse">
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
                            key={videoId || `video-${idx}`} 
                            onClick={() => setSelectedVideo(item)}
                            className="w-[260px] md:w-[300px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 snap-start cursor-pointer hover:shadow-md transition-shadow group"
                          >
                            <div className="relative w-full h-36 md:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              {thumbnailUrl ? (
                                <LazyImage 
                                  src={thumbnailUrl} 
                                  alt={item.judul} 
                                  containerClassName="w-full h-full"
                                  className="group-hover:scale-105 transition-transform duration-500"
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

              {/* Minimalist Footer Section */}
              {(isLoading || data?.footer) && (
                <footer className="bg-white border-t border-gray-200 mt-auto pt-10 pb-24 md:pb-10 px-6 md:px-12 w-full overflow-hidden">
                  {isLoading ? (
                    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 w-full animate-pulse">
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
                    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 w-full">
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
                  <div className="max-w-[1600px] mx-auto mt-8 pt-6 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 w-full">
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
            )}
          </main>

        </div>

        {/* Bottom Navigation Bar (Mobile & Tablet) */}
        {!isStandaloneView && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-2 md:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-around items-center shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            <BottomNavItem icon={<Home size={24} />} label="Beranda" active={currentView === 'home'} t={t} onClick={() => handleNavigate('home')} />
            <BottomNavItem icon={<PieChart size={24} />} label="Radial" active={(currentView as string) === 'radial'} t={t} onClick={() => handleNavigate('radial')} />
            <BottomNavItem icon={<MessageCircle size={24} />} label="Tanya AI" active={currentView === 'chatbot'} t={t} onClick={() => handleNavigate('chatbot')} />
            <BottomNavItem icon={<FileText size={24} />} label="SPMB" active={(currentView as string) === 'spmb'} t={t} onClick={() => handleNavigate('spmb')} />
            <BottomNavItem icon={<User size={24} />} label="Profil" active={currentView === 'profil'} t={t} onClick={() => handleNavigate('profil')} />
          </nav>
        )}

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

        {/* Exit Confirmation Modal */}
        <AnimatePresence>
          {showExitModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Keluar Aplikasi</h3>
                  <p className="text-gray-500 mb-6">Apakah Anda yakin ingin keluar dari MIS IT Al Uswah?</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={cancelExit}
                      className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={confirmExit}
                      className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-500/30"
                    >
                      Ya, Keluar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
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
        <AnimatePresence initial={false}>
          {currentView !== 'home' && (
            <motion.div
              key="subview-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`absolute inset-0 bg-gray-50 flex flex-col h-full overflow-hidden ${
                isStandaloneView ? 'fixed inset-0 w-full h-[100dvh] z-[70] bg-white' : 'z-50'
              }`}
            >
              <ErrorBoundary>
                <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><div className={`w-8 h-8 border-4 border-t-transparent ${t.primaryText} rounded-full animate-spin border-opacity-50`}></div></div>}>
                  {currentView === 'quran' && <QuranView t={t} title={getServiceTitle('quran')} onBack={handleBack} />}
                  {currentView === 'doa' && <DoaView t={t} title={getServiceTitle('doa')} onBack={handleBack} />}
                  {currentView === 'kalender' && <KalenderView t={t} title={getServiceTitle('kalender')} onBack={handleBack} />}
                  {currentView === 'spmb' && <SPMBView t={t} title={getServiceTitle('spmb')} onBack={handleBack} onNavigate={handleNavigate} />}
                  {currentView === 'spmb-form' && <SPMBModal t={t} onClose={handleBack} />}
                  {currentView === 'kritik' && <KritikView t={t} title={getServiceTitle('kritik')} onBack={handleBack} />}
                  {currentView === 'program' && <ProgramView t={t} title={getServiceTitle('program')} onBack={handleBack} />}
                  {currentView === 'ekstra' && <EkstraView t={t} title={getServiceTitle('ekstra')} onBack={handleBack} />}
                  {currentView === 'sarpras' && <SarprasView t={t} title={getServiceTitle('sarpras')} onBack={handleBack} />}
                  {currentView === 'news' && <NewsListView t={t} newsList={newsList} onBack={handleBack} onSelectNews={setSelectedNews} />}
                  {currentView === 'profil' && <ProfilView t={t} onBack={handleBack} />}
                  {currentView === 'absensi' && <AbsensiView t={t} title={getServiceTitle('absensi')} onBack={handleBack} />}
                  {currentView === 'affiliasi' && <AffiliasiView t={t} title={getServiceTitle('affiliasi')} onBack={handleBack} />}
                  {currentView === 'yaumiyah' && <YaumiyahView t={t} title={getServiceTitle('yaumiyah')} onBack={handleBack} />}
                  {currentView === 'radial' && <RadialView t={t} onBack={handleBack} />}
                  {currentView === 'review' && <ReviewView t={t} title={getServiceTitle('review')} onBack={handleBack} />}
                  {currentView === 'review-list' && <ReviewListView t={t} data={data?.review || []} onBack={handleBack} />}
                  {currentView === 'galeri' && <GaleriView t={t} onBack={handleBack} />}
                  {currentView === 'chatbot' && <ChatbotView t={t} onBack={handleBack} />}
                  {currentView === 'kelulusan' && <KelulusanView t={t} title={getServiceTitle('kelulusan')} onBack={handleBack} />}
                  {currentView === 'notification-center' && <NotificationCenterView t={t} onBack={handleBack} onSelectNotif={handleNotifClick} />}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        <ReloadPrompt />
      </div>
    </div>
  );
}
