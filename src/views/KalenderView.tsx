import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar as CalendarIcon, Info } from 'lucide-react';
import { ThemeConfig } from '../types';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { useData } from '../context/DataContext';

export function KalenderView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const { data, isLoading } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDate, setHijriDate] = useState<string>('Memuat...');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    const fetchHijriDate = async () => {
      try {
        const formattedDate = format(currentDate, 'dd-MM-yyyy');
        const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${formattedDate}`);
        const result = await response.json();
        
        if (result && result.data && result.data.hijri) {
          const hijri = result.data.hijri;
          // Map English month names to Indonesian
          const monthMap: Record<string, string> = {
            "Muharram": "Muharram",
            "Safar": "Safar",
            "Rabi' al-awwal": "Rabi'ul Awal",
            "Rabi' al-thani": "Rabi'ul Akhir",
            "Jumada al-awwal": "Jumadil Awal",
            "Jumada al-thani": "Jumadil Akhir",
            "Rajab": "Rajab",
            "Sha'ban": "Sya'ban",
            "Shaʿbān": "Sya'ban",
            "Ramadan": "Ramadhan",
            "Shawwal": "Syawal",
            "Dhu al-Qi'dah": "Dzulqa'dah",
            "Dhu al-Hijjah": "Dzulhijjah"
          };
          
          const monthNameEn = hijri.month.en;
          const monthNameId = monthMap[monthNameEn] || monthNameEn;
          
          setHijriDate(`${monthNameId} ${hijri.year} H`);
        }
      } catch (error) {
        console.error('Error fetching Hijri date:', error);
        setHijriDate('Gagal memuat');
      }
    };

    fetchHijriDate();
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const endDate = monthEnd;

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const puasaSunnah = [
    { date: new Date(2024, 1, 15), name: 'Ayyamul Bidh' },
    { date: new Date(2024, 1, 16), name: 'Ayyamul Bidh' },
    { date: new Date(2024, 1, 17), name: 'Ayyamul Bidh' },
    { date: new Date(2024, 1, 19), name: 'Senin Kamis' },
    { date: new Date(2024, 1, 22), name: 'Senin Kamis' },
  ];

  const isPuasa = (day: Date) => {
    return puasaSunnah.find(p => isSameDay(p.date, day));
  };

  const kalenderData = data?.kalender || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">{title || "Kalender Akademik & Hijriyah"}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CalendarIcon className={t.primaryText} />
                {format(currentDate, dateFormat, { locale: id })}
              </h3>
              <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {hijriDate}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center font-semibold text-gray-500 text-sm">
              <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => {
                const puasa = isPuasa(day);
                return (
                  <div 
                    key={day.toString()} 
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all ${!isSameMonth(day, monthStart) ? 'text-gray-300' : isToday(day) ? `${t.primaryBg} text-white font-bold shadow-md` : 'text-gray-700 hover:bg-gray-50'} ${puasa && !isToday(day) ? 'bg-amber-50 border border-amber-200' : ''}`}
                  >
                    <span className="text-lg">{format(day, 'd')}</span>
                    {puasa && (
                      <span className={`text-[8px] leading-tight font-medium mt-0.5 ${isToday(day) ? 'text-white/90' : 'text-amber-600'}`}>
                        {puasa.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Info size={18} className={t.primaryText} />
                Agenda Pendidikan
              </h4>
              <ul className="space-y-3">
                {kalenderData.length > 0 ? (
                  kalenderData.map((item, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${item.is_libur ? 'bg-red-500' : t.primaryBg}`}></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{item.kegiatan}</p>
                        <p className="text-xs text-gray-500">
                          {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">Belum ada agenda pendidikan.</li>
                )}
              </ul>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Info size={18} className="text-amber-500" />
                Jadwal Puasa Sunnah
              </h4>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500"></div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Ayyamul Bidh (13,14,15 Sya'ban)</p>
                    <p className="text-xs text-gray-500">23 - 25 Februari 2024</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
