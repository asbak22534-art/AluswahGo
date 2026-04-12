import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Star, User, GraduationCap, Users, Image as ImageIcon, X } from 'lucide-react';
import { ThemeConfig } from '../types';
import { LazyImage } from '../components/LazyImage';

interface ReviewListViewProps {
  t: ThemeConfig;
  onBack: () => void;
  data: any[];
}

// Helper component for safe image loading
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

export const ReviewListView: React.FC<ReviewListViewProps> = ({ t, onBack, data }) => {
  const [filterPeran, setFilterPeran] = useState<'Semua' | 'Alumni' | 'Wali Murid'>('Semua');
  const [filterTahun, setFilterTahun] = useState<string>('Semua');
  const [filterKelas, setFilterKelas] = useState<string>('Semua');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  // Extract unique years and classes
  const tahunList = useMemo(() => {
    const years = new Set<string>();
    data.forEach(item => {
      if (item.Peran === 'Alumni' && item['Tahun Lulus']) {
        years.add(String(item['Tahun Lulus']));
      }
    });
    return ['Semua', ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  }, [data]);

  const kelasList = useMemo(() => {
    const classes = new Set<string>();
    data.forEach(item => {
      if (item.Peran === 'Wali Murid' && item.Kelas) {
        classes.add(String(item.Kelas));
      }
    });
    return ['Semua', ...Array.from(classes).sort()];
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterPeran !== 'Semua' && item.Peran !== filterPeran) return false;
      
      if (filterPeran === 'Alumni' && filterTahun !== 'Semua') {
        if (String(item['Tahun Lulus']) !== filterTahun) return false;
      }
      
      if (filterPeran === 'Wali Murid' && filterKelas !== 'Semua') {
        if (String(item.Kelas) !== filterKelas) return false;
      }
      
      return true;
    });
  }, [data, filterPeran, filterTahun, filterKelas]);

  const getDirectDriveUrl = (url: string) => {
    if (!url || typeof url !== 'string' || url.trim() === "" || url.trim() === "-") return null;
    const firstUrl = url.split(',')[0].trim();
    if (!firstUrl.includes("drive.google.com")) return firstUrl;
    let match = firstUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    match = firstUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    return firstUrl;
  };

  const getFallbackDriveUrl = (url: string) => {
    if (!url || typeof url !== 'string' || url.trim() === "" || url.trim() === "-") return null;
    const firstUrl = url.split(',')[0].trim();
    if (!firstUrl.includes("drive.google.com")) return firstUrl;
    let match = firstUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    match = firstUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return firstUrl;
  };

  const getFotoKegiatanValue = (item: any) => {
    if (!item) return null;
    if (item['Foto Kegiatan']) return item['Foto Kegiatan'];
    const kegiatanKey = Object.keys(item).find(k => 
      k.trim().toLowerCase() === 'foto kegiatan' || 
      k.toLowerCase().includes('kegiatan')
    );
    if (kegiatanKey && item[kegiatanKey]) return item[kegiatanKey];
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
      return (
        <div className={`${sizeClasses} rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold shrink-0`}>
          {name.charAt(0).toUpperCase()}
        </div>
      );
    } else {
      const name = item['Nama Wali'] || 'W';
      return (
        <div className={`${sizeClasses} rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold shrink-0`}>
          {name.charAt(0).toUpperCase()}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Header */}
      <div className={`${t.primaryBg} text-white py-3 px-4 sticky top-0 z-20 shadow-md`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Semua Ulasan</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 shadow-sm z-10 sticky top-[60px]">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => { setFilterPeran('Semua'); setFilterTahun('Semua'); setFilterKelas('Semua'); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterPeran === 'Semua' ? t.primaryBg + ' text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Semua
          </button>
          <button
            onClick={() => { setFilterPeran('Alumni'); setFilterKelas('Semua'); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${filterPeran === 'Alumni' ? t.primaryBg + ' text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <GraduationCap size={16} />
            Alumni
          </button>
          <button
            onClick={() => { setFilterPeran('Wali Murid'); setFilterTahun('Semua'); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${filterPeran === 'Wali Murid' ? t.primaryBg + ' text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Users size={16} />
            Wali Murid
          </button>
        </div>

        {/* Sub-filters */}
        {filterPeran === 'Alumni' && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Tahun Lulus:</span>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {tahunList.map(tahun => (
                <button
                  key={tahun}
                  onClick={() => setFilterTahun(tahun)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filterTahun === tahun ? t.primaryLightBg + ' ' + t.primaryText : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  {tahun}
                </button>
              ))}
            </div>
          </div>
        )}

        {filterPeran === 'Wali Murid' && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Kelas:</span>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {kelasList.map(kelas => (
                <button
                  key={kelas}
                  onClick={() => setFilterKelas(kelas)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filterKelas === kelas ? t.primaryLightBg + ' ' + t.primaryText : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  {kelas}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {filteredData.slice(0, visibleCount).map((item, idx) => {
              const rating = parseInt(item['Rating']) || 5;
              const nama = item['Peran'] === 'Alumni' ? item['Nama Siswa'] : item['Nama Wali'];
              const rawFotoKegiatan = getFotoKegiatanValue(item);
              const fotoKegiatanUrl = getDirectDriveUrl(rawFotoKegiatan);
              const fotoProfilUrl = getDirectDriveUrl(item['Foto']);

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow"
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
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Star size={48} className="mb-4 opacity-20" />
            <p>Tidak ada ulasan ditemukan</p>
          </div>
        )}

        {filteredData.length > visibleCount && (
          <div className="flex justify-center mt-8 pb-12">
            <button
              onClick={() => setVisibleCount(prev => prev + 10)}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-colors border-2 ${t.primaryText} border-current hover:bg-gray-50`}
            >
              Muat Lebih Banyak
            </button>
          </div>
        )}
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
