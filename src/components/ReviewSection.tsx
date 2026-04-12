import React, { useState, useEffect, useRef } from 'react';
import { Star, X, Image as ImageIcon, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LazyImage } from './LazyImage';

interface ReviewSectionProps {
  data: any[];
  isLoading: boolean;
  onViewAll?: () => void;
}

// Komponen helper untuk memuat gambar dengan aman (mencegah penumpukan icon broken image)
const SafeImage = ({ 
  url, 
  alt, 
  className, 
  fallback,
  fallbackUrl
}: { 
  url: string | null; 
  alt: string; 
  className: string; 
  fallback?: React.ReactNode;
  fallbackUrl?: string | null;
}) => {
  const [error, setError] = useState(false);
  const [useFallbackUrl, setUseFallbackUrl] = useState(false);

  useEffect(() => {
    setError(false);
    setUseFallbackUrl(false);
  }, [url]);

  if (!url || error) {
    return fallback ? <>{fallback}</> : null;
  }

  const currentUrl = useFallbackUrl && fallbackUrl ? fallbackUrl : url;

  return (
    <LazyImage 
      src={currentUrl} 
      alt={alt} 
      containerClassName={className}
      className={className}
      onError={() => {
        if (!useFallbackUrl && fallbackUrl) {
          setUseFallbackUrl(true);
        } else {
          setError(true);
        }
      }}
    />
  );
};

export const ReviewSection: React.FC<ReviewSectionProps> = ({ data, isLoading, onViewAll }) => {
  const { theme: t } = useTheme();
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const getDirectDriveUrl = (url: string) => {
    if (!url || typeof url !== 'string' || url.trim() === "" || url.trim() === "-") return null;
    
    // Ambil URL pertama jika ada beberapa URL yang dipisahkan koma
    const firstUrl = url.split(',')[0].trim();

    if (!firstUrl.includes("drive.google.com")) return firstUrl;
    
    let match = firstUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    
    match = firstUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    
    return firstUrl;
  };

  const getFallbackDriveUrl = (url: string) => {
    if (!url || typeof url !== 'string' || url.trim() === "" || url.trim() === "-") return null;
    
    const firstUrl = url.split(',')[0].trim();

    if (!firstUrl.includes("drive.google.com")) return firstUrl;
    
    let match = firstUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    
    match = firstUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    
    return firstUrl;
  };

  const getFotoKegiatanValue = (item: any) => {
    if (!item) return null;
    
    // 1. Coba exact match
    if (item['Foto Kegiatan']) return item['Foto Kegiatan'];
    
    // 2. Coba case-insensitive match atau yang mengandung kata 'kegiatan'
    const kegiatanKey = Object.keys(item).find(k => 
      k.trim().toLowerCase() === 'foto kegiatan' || 
      k.toLowerCase().includes('kegiatan')
    );
    if (kegiatanKey && item[kegiatanKey]) return item[kegiatanKey];

    // 3. Fallback ekstrim: Cari value string apapun yang merupakan link Google Drive, 
    // dan BUKAN merupakan foto profil (item['Foto'])
    const driveKeys = Object.keys(item).filter(k => 
      k !== 'Foto' && 
      k.toLowerCase() !== 'foto' &&
      typeof item[k] === 'string' && 
      item[k].includes('drive.google.com')
    );
    
    if (driveKeys.length > 0) return item[driveKeys[0]];

    return null;
  };

  const getFallbackAvatar = (item: any, sizeClasses: string) => {
    if (item['Peran'] === 'Alumni') {
      const name = item['Nama Siswa'] || 'A';
      const words = name.trim().split(' ');
      let initials = words[0][0];
      if (words.length > 1) initials += words[1][0];
      
      return (
        <div className={`${sizeClasses} rounded-full ${t.primaryBg} text-white flex items-center justify-center font-bold text-sm tracking-wider uppercase shrink-0`}>
          {initials}
        </div>
      );
    } else {
      if (item['Status Wali'] === 'Ayah') {
        return (
          <div className={`${sizeClasses} rounded-full ${t.primaryLightBg} flex items-center justify-center shrink-0`}>
            <User className={`w-3/5 h-3/5 ${t.primaryText}`} />
          </div>
        );
      } else {
        return (
          <div className={`${sizeClasses} rounded-full bg-pink-100 flex items-center justify-center shrink-0`}>
            <User className="w-3/5 h-3/5 text-pink-500" />
          </div>
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 w-full">
        <div className="flex items-center justify-between mb-4 px-4 md:px-8">
          <h3 className="font-bold text-gray-800 text-lg md:text-xl">Kata Mereka</h3>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-8 snap-x hide-scrollbar items-stretch">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`review-skeleton-${idx}`} className="w-[280px] md:w-[320px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col snap-start animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({length: 5}).map((_, i) => (
                    <div key={`skeleton-star-${i}`} className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex-1 space-y-2 mb-5">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="w-full h-px bg-gray-100 mb-4"></div>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const reviews = data.filter((item: any) => item['Status Tampil'] === true || String(item['Status Tampil']).toUpperCase() === 'TRUE');

  if (reviews.length === 0) return null;

  return (
    <div className="py-4 w-full">
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h3 className="font-bold text-gray-800 text-lg md:text-xl">Kata Mereka</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className={`text-sm font-medium ${t.primaryText} hover:underline`}
          >
            Lihat Semua
          </button>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-8 snap-x hide-scrollbar items-stretch"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {reviews.map((item: any, idx: number) => {
          const rating = parseInt(item['Rating']) || 5;
          const nama = item['Peran'] === 'Alumni' ? item['Nama Siswa'] : item['Nama Wali'];
          const peranLabel = item['Peran'] === 'Alumni' ? `Alumni ${item['Tahun Lulus']}` : `Wali Murid Kelas ${item['Kelas']}`;
          const rawFotoKegiatan = getFotoKegiatanValue(item);
          const fotoKegiatanUrl = getDirectDriveUrl(rawFotoKegiatan);
          const fotoProfilUrl = getDirectDriveUrl(item['Foto']);
          
          return (
            <div 
              key={item['Timestamp'] || `review-${idx}`} 
              className="w-[280px] md:w-[320px] max-w-[85vw] shrink-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col snap-start cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedReview(item)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star key={`star-${i}`} size={16} className={i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                  ))}
                </div>
                {fotoKegiatanUrl && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${t.primaryLightBg} ${t.primaryText}`}>
                    <ImageIcon size={12} />
                    Foto
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-700 italic mb-5 line-clamp-4 flex-1">"{item['Testimoni']}"</p>
              
              <div className="w-full h-px bg-gray-100 mb-4"></div>

              <div className="flex items-center gap-3 mt-auto">
                <SafeImage 
                  url={fotoProfilUrl} 
                  alt={nama} 
                  className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0"
                  fallback={getFallbackAvatar(item, "w-10 h-10")}
                  fallbackUrl={getFallbackDriveUrl(item['Foto'])}
                />
                <div className="flex-1 min-w-0">
                  <h5 className={`font-bold text-gray-900 text-sm truncate uppercase`}>{nama}</h5>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {item['Peran'] === 'Alumni' ? (
                      <>
                        <span className={t.primaryText}>Alumni {item['Tahun Lulus']}</span>
                        {item['Kelas'] && <span className="text-gray-400"> &bull; {item['Kelas']}</span>}
                      </>
                    ) : (
                      <>
                        <span className={t.primaryText}>Kelas {item['Kelas']}</span>
                        {item['Nama Siswa'] && <span className="text-gray-400"> &bull; Wali dari {item['Nama Siswa']}</span>}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReview(null)}>
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedReview(null)}
              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm hover:bg-gray-100 rounded-full transition-colors z-20 shadow-sm border border-gray-100"
            >
              <X size={20} className="text-gray-500" />
            </button>
            
            <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col">
              <div className="flex gap-1.5 mb-6">
                {Array.from({length: 5}).map((_, i) => (
                  <Star 
                    key={`modal-star-${i}`} 
                    size={24} 
                    className={i < (parseInt(selectedReview['Rating']) || 5) ? "text-amber-400 fill-amber-400" : "text-gray-200"} 
                  />
                ))}
              </div>

              <p className="text-gray-800 italic text-lg md:text-xl leading-relaxed whitespace-pre-wrap mb-6">
                "{selectedReview['Testimoni']}"
              </p>

              {getFotoKegiatanValue(selectedReview) && getDirectDriveUrl(getFotoKegiatanValue(selectedReview)) && (
                <div className="mb-6">
                  <SafeImage 
                    url={getDirectDriveUrl(getFotoKegiatanValue(selectedReview))}
                    alt="Kegiatan"
                    className="w-full rounded-xl shadow-sm object-cover max-h-[300px] md:max-h-[400px]"
                    fallbackUrl={getFallbackDriveUrl(getFotoKegiatanValue(selectedReview))}
                  />
                </div>
              )}

              <div className="w-full h-px bg-gray-100 mb-6 mt-auto"></div>

              <div className="flex items-center gap-4">
                <SafeImage 
                  url={getDirectDriveUrl(selectedReview['Foto'])}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover bg-gray-100 shrink-0"
                  fallback={getFallbackAvatar(selectedReview, "w-14 h-14 text-xl")}
                  fallbackUrl={getFallbackDriveUrl(selectedReview['Foto'])}
                />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-gray-900 text-base md:text-lg truncate uppercase`}>
                    {selectedReview['Peran'] === 'Alumni' ? selectedReview['Nama Siswa'] : selectedReview['Nama Wali']}
                  </h4>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {selectedReview['Peran'] === 'Alumni' ? (
                      <>
                        <span className={t.primaryText}>Alumni {selectedReview['Tahun Lulus']}</span>
                        {selectedReview['Kelas'] && <span className="text-gray-400"> &bull; {selectedReview['Kelas']}</span>}
                      </>
                    ) : (
                      <>
                        <span className={t.primaryText}>Kelas {selectedReview['Kelas']}</span>
                        {selectedReview['Nama Siswa'] && <span className="text-gray-400"> &bull; Wali dari {selectedReview['Nama Siswa']}</span>}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
