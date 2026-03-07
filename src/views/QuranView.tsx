import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, PlayCircle, PauseCircle } from 'lucide-react';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { ThemeConfig } from '../types';
import { GlobalRunningText } from '../components/GlobalRunningText';

type Chapter = {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: {
    name: string;
  };
};

type Ayah = {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: { '01': string };
};

const gridComponents = {
  List: React.forwardRef<HTMLDivElement, any>((props, ref) => (
    <div {...props} ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4" />
  )),
  Item: ({ children, ...props }: any) => (
    <div {...props} className="flex">{children}</div>
  )
};

export function QuranView({ t, onBack }: { t: ThemeConfig, onBack: () => void }) {
  const [surahs, setSurahs] = useState<Chapter[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSurah !== null) {
          setSelectedSurah(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSurah, onBack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSurah !== null) {
          setSelectedSurah(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSurah, onBack]);

  useEffect(() => {
    // Menggunakan API quran.com v4 karena v1 sudah deprecated/tidak aktif
    fetch('https://api.quran.com/api/v4/chapters')
      .then(res => res.json())
      .then(data => setSurahs(data.chapters))
      .catch(err => console.error(err));
  }, []);

  const loadSurah = async (nomor: number) => {
    setLoading(true);
    setSelectedSurah(nomor);
    try {
      // Tetap menggunakan equran.id untuk detail ayat karena memiliki teks latin, indonesia, dan audio per ayat yang lengkap
      const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
      const data = await res.json();
      setAyahs(data.data.ayat);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = (ayah: Ayah) => {
    if (playingAudio === ayah.nomorAyat) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(ayah.audio['01']);
      audio.play();
      audio.onended = () => setPlayingAudio(null);
      audioRef.current = audio;
      setPlayingAudio(ayah.nomorAyat);
    }
  };

  const filteredSurahs = surahs.filter(s => 
    s.name_simple.toLowerCase().includes(search.toLowerCase()) || 
    s.translated_name.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={selectedSurah ? () => setSelectedSurah(null) : onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">{selectedSurah ? `Surat ke-${selectedSurah}` : "Al-Qur'an Digital"}</h2>
      </header>

      <GlobalRunningText t={t} />

      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedSurah ? (
          <>
            <div className="p-4 bg-white border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari surat..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 bg-gray-50 min-h-0 relative">
              {surahs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className={`w-8 h-8 border-4 border-t-transparent ${t.primaryText} rounded-full animate-spin border-opacity-50`}></div>
                </div>
              ) : (
                <VirtuosoGrid
                  data={filteredSurahs}
                  components={gridComponents}
                  className="h-full w-full"
                  itemContent={(index, surah) => (
                    <button 
                      onClick={() => loadSurah(surah.id)}
                      className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all text-left active:scale-95"
                    >
                      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg ${t.primaryLightBg} ${t.primaryText}`}>
                        {surah.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">{surah.name_simple}</h3>
                        <p className="text-xs text-gray-500 truncate">{surah.translated_name.name} • {surah.verses_count} Ayat</p>
                      </div>
                      <div className="text-xl font-arabic text-gray-400">
                        {surah.name_arabic}
                      </div>
                    </button>
                  )}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 bg-white min-h-0 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className={`w-8 h-8 border-4 border-t-transparent ${t.primaryText} rounded-full animate-spin border-opacity-50`}></div>
              </div>
            ) : (
              <Virtuoso
                data={ayahs}
                className="h-full w-full"
                itemContent={(index, ayah) => (
                  <div className="p-5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${t.primaryLightBg} ${t.primaryText}`}>
                        {ayah.nomorAyat}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-3xl md:text-4xl font-arabic leading-[2.5] text-gray-900" dir="rtl">
                          {ayah.teksArab}
                        </p>
                      </div>
                    </div>
                    <div className="pl-12">
                      <p className="text-sm text-gray-600 italic mb-1">{ayah.teksLatin}</p>
                      <p className="text-sm text-gray-800 font-medium mb-3">{ayah.teksIndonesia}</p>
                      <button 
                        onClick={() => toggleAudio(ayah)}
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${playingAudio === ayah.nomorAyat ? `${t.primaryBg} text-white` : `bg-gray-100 ${t.primaryText} hover:bg-gray-200`}`}
                      >
                        {playingAudio === ayah.nomorAyat ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                        {playingAudio === ayah.nomorAyat ? 'Jeda Audio' : 'Putar Audio'}
                      </button>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
