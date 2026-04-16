import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar as CalendarIcon, Info, ChevronLeft, ChevronRight, Moon, Book, Flag } from 'lucide-react';
import { ThemeConfig } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import { useData } from '../context/DataContext';

const parseCustomDate = (dateStr: any) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  const str = String(dateStr).trim();
  // Check DD/MM/YYYY or DD/MM/YY or DD-MM-YYYY
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }
  // Fallback to standard Date parsing
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export function KalenderView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const { data, isLoading } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDate, setHijriDate] = useState<string>('Memuat...');
  const [nationalHolidays, setNationalHolidays] = useState<any[]>([]);
  const [islamicEvents, setIslamicEvents] = useState<any[]>([]);
  const [isLoadingApis, setIsLoadingApis] = useState(false);
  const [fetchedYears, setFetchedYears] = useState<Set<number>>(new Set());

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
    const fetchYearData = async () => {
      const year = currentDate.getFullYear();
      
      // If we already fetched data for this year, skip
      if (fetchedYears.has(year)) return;

      setIsLoadingApis(true);

      try {
        // 1. Fetch National Holidays for the entire year
        let holidays: any[] = [];
        try {
          const holidayRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
          if (holidayRes.ok) {
            const holidayData = await holidayRes.json();
            holidays = holidayData.map((h: any) => {
              // Ensure timezone consistency by setting time to noon
              const d = new Date(h.date);
              d.setHours(12, 0, 0, 0);
              return {
                kegiatan: h.localName || h.name,
                parsedDate: d,
                jenis: 'Nasional',
                is_libur: true
              };
            });
          }
        } catch (e) {
          console.error('Failed to fetch national holidays from Nager.Date API');
        }

        // 2. Fetch Islamic Events (Ayyamul Bidh) for the entire year
        let islamic: any[] = [];
        try {
          // Fetch sequentially to avoid rate limiting from Aladhan API
          for (let i = 1; i <= 12; i++) {
            try {
              const aladhanRes = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${i}/${year}`);
              if (aladhanRes.ok) {
                const aladhanData = await aladhanRes.json();
                if (aladhanData.code === 200 && aladhanData.data) {
                  const monthData = aladhanData.data;
                  monthData.forEach((day: any) => {
                    const gDate = new Date(`${day.gregorian.year}-${day.gregorian.month.number}-${day.gregorian.day}`);
                    gDate.setHours(12, 0, 0, 0); // Timezone consistency
                    
                    // Ayyamul Bidh only
                    const hDay = parseInt(day.hijri.day, 10);
                    if (hDay === 13 || hDay === 14 || hDay === 15) {
                      islamic.push({
                        kegiatan: `Puasa Ayyamul Bidh (${hDay} ${day.hijri.month.en})`,
                        parsedDate: gDate,
                        jenis: 'Islami',
                        is_libur: false
                      });
                    }

                    // Supplement missing National Islamic Holidays from Aladhan
                    if (day.hijri.holidays && day.hijri.holidays.length > 0) {
                      day.hijri.holidays.forEach((hol: string) => {
                        const map: Record<string, string> = {
                          "Eid al-Fitr": "Hari Raya Idul Fitri", 
                          "Eid al-Adha": "Hari Raya Idul Adha",
                          "Awal Muharram": "Tahun Baru Islam", 
                          "1st of Muharram": "Tahun Baru Islam",
                          "Isra and Mi'raj": "Isra Mikraj Nabi Muhammad SAW",
                          "Mawlid al-Nabi": "Maulid Nabi Muhammad SAW"
                        };
                        if (map[hol]) {
                          // Check if not already in holidays to prevent duplicates
                          const exists = holidays.some(h => 
                            h.kegiatan === map[hol] && h.parsedDate.getTime() === gDate.getTime()
                          );
                          if (!exists) {
                            holidays.push({
                              kegiatan: map[hol],
                              parsedDate: gDate,
                              jenis: 'Nasional',
                              is_libur: true
                            });
                          }
                        }
                      });
                    }
                  });
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch Islamic events for month ${i}`, err);
            }
          }
        } catch (e) {
          console.error('Failed to fetch Islamic events', e);
        }

        const uniqueHolidays = holidays.filter((item, index, self) => 
          index === self.findIndex((t) => (
            t.kegiatan === item.kegiatan && t.parsedDate.getTime() === item.parsedDate.getTime()
          ))
        );
        const uniqueIslamic = islamic.filter((item, index, self) => 
          index === self.findIndex((t) => (
            t.kegiatan === item.kegiatan && t.parsedDate.getTime() === item.parsedDate.getTime()
          ))
        );

        setNationalHolidays(prev => {
          const newItems = uniqueHolidays.filter(newItem => 
            !prev.some(existing => existing.kegiatan === newItem.kegiatan && existing.parsedDate.getTime() === newItem.parsedDate.getTime())
          );
          return [...prev, ...newItems];
        });
        setIslamicEvents(prev => {
          const newItems = uniqueIslamic.filter(newItem => 
            !prev.some(existing => existing.kegiatan === newItem.kegiatan && existing.parsedDate.getTime() === newItem.parsedDate.getTime())
          );
          return [...prev, ...newItems];
        });
        setFetchedYears(prev => new Set(prev).add(year));

      } catch (error) {
        console.error('Error fetching calendar APIs:', error);
      } finally {
        setIsLoadingApis(false);
      }
    };

    fetchYearData();
  }, [currentDate.getFullYear()]); // Only trigger when year changes

  useEffect(() => {
    // Fetch Hijri date for the header (month specific)
    const fetchHijriHeader = async () => {
      try {
        const formattedDate = format(currentDate, 'dd-MM-yyyy');
        const hijriRes = await fetch(`https://api.aladhan.com/v1/gToH?date=${formattedDate}`);
        const hijriResult = await hijriRes.json();
        
        if (hijriResult?.data?.hijri) {
          const hijri = hijriResult.data.hijri;
          const monthMap: Record<string, string> = {
            "Muharram": "Muharram", "Safar": "Safar", "Rabi' al-awwal": "Rabi'ul Awal",
            "Rabi' al-thani": "Rabi'ul Akhir", "Jumada al-awwal": "Jumadil Awal",
            "Jumada al-thani": "Jumadil Akhir", "Rajab": "Rajab", "Sha'ban": "Sya'ban",
            "Shaʿbān": "Sya'ban", "Ramadan": "Ramadhan", "Shawwal": "Syawal",
            "Dhu al-Qi'dah": "Dzulqa'dah", "Dhu al-Hijjah": "Dzulhijjah"
          };
          const monthNameId = monthMap[hijri.month.en] || hijri.month.en;
          setHijriDate(`${monthNameId} ${hijri.year} H`);
        }
      } catch (error) {
        setHijriDate('Gagal memuat');
      }
    };
    fetchHijriHeader();
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  // FIX: Use startOfWeek and endOfWeek to align the grid properly
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 = Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const kalenderData = data?.kalender || [];

  // Filter and sort manual agenda based on the currently viewed month
  const manualAgenda = kalenderData
    .map(item => ({
      ...item,
      parsedDate: parseCustomDate(item.tanggal),
      jenis: item.jenis || 'Akademik' // Default to Akademik if empty
    }))
    .filter(item => {
      if (!item.parsedDate) return false;
      return item.parsedDate.getMonth() === currentDate.getMonth() &&
             item.parsedDate.getFullYear() === currentDate.getFullYear();
    });

  // Combine all agendas and filter for current month ONLY
  const currentMonthAgenda = [...manualAgenda, ...nationalHolidays, ...islamicEvents]
    .filter(item => {
      if (!item.parsedDate) return false;
      return item.parsedDate.getMonth() === currentDate.getMonth() &&
             item.parsedDate.getFullYear() === currentDate.getFullYear();
    })
    .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());

  // Group agendas by type for minimalist cards
  const agendaPendidikan = currentMonthAgenda.filter(a => {
    const t = String(a.jenis).toLowerCase();
    return t.includes('akademik') || t.includes('pendidikan');
  });
  const agendaNasional = currentMonthAgenda.filter(a => String(a.jenis).toLowerCase().includes('nasional'));
  
  const rawAgendaIbadah = currentMonthAgenda.filter(a => {
    const t = String(a.jenis).toLowerCase();
    return t.includes('islami') || t.includes('ibadah') || t.includes('yaumiyah');
  });

  // Group Puasa Ayyamul Bidh
  const groupedAgendaIbadah: any[] = [];
  let currentBidhGroup: any = null;

  rawAgendaIbadah.forEach(item => {
    if (item.kegiatan.startsWith('Puasa Ayyamul Bidh')) {
      const match = item.kegiatan.match(/Puasa Ayyamul Bidh \((\d+) (.*)\)/);
      if (match) {
        const hDay = match[1];
        const hMonth = match[2];
        if (currentBidhGroup && currentBidhGroup.hMonth === hMonth) {
          currentBidhGroup.endDate = item.parsedDate;
          currentBidhGroup.endHDay = hDay;
        } else {
          if (currentBidhGroup) groupedAgendaIbadah.push(currentBidhGroup);
          currentBidhGroup = {
            ...item,
            isBidhGroup: true,
            hMonth,
            startHDay: hDay,
            endHDay: hDay,
            startDate: item.parsedDate,
            endDate: item.parsedDate
          };
        }
      } else {
        if (currentBidhGroup) { groupedAgendaIbadah.push(currentBidhGroup); currentBidhGroup = null; }
        groupedAgendaIbadah.push(item);
      }
    } else {
      if (currentBidhGroup) { groupedAgendaIbadah.push(currentBidhGroup); currentBidhGroup = null; }
      groupedAgendaIbadah.push(item);
    }
  });
  if (currentBidhGroup) groupedAgendaIbadah.push(currentBidhGroup);

  const agendaIbadah = groupedAgendaIbadah.map(item => {
    if (item.isBidhGroup) {
      const startStr = format(item.startDate, 'dd');
      const endStr = format(item.endDate, 'dd MMMM yyyy', { locale: id });
      const dateStr = item.startDate.getTime() === item.endDate.getTime() 
        ? endStr 
        : `${startStr} - ${endStr}`;
      const hDayStr = item.startHDay === item.endHDay 
        ? item.startHDay 
        : `${item.startHDay}-${item.endHDay}`;
      
      return {
        ...item,
        kegiatan: `Puasa Ayyamul Bidh (${hDayStr} ${item.hMonth})`,
        displayDate: dateStr
      };
    }
    return item;
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

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
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 min-w-[140px] justify-center">
                  <CalendarIcon className={t.primaryText} size={20} />
                  {format(currentDate, dateFormat, { locale: id })}
                </h3>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="text-xs md:text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hidden sm:block">
                {hijriDate}
              </div>
            </div>
            {/* Mobile Hijri Date */}
            <div className="text-center mb-4 sm:hidden">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {hijriDate}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center font-semibold text-gray-500 text-sm">
              <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => {
                const dayAgendas = currentMonthAgenda.filter(a => isSameDay(a.parsedDate!, day));
                const isHoliday = dayAgendas.some(a => String(a.is_libur).toUpperCase() === 'TRUE');
                const hasAkademik = dayAgendas.some(a => {
                  const t = String(a.jenis).toLowerCase();
                  return t.includes('akademik') || t.includes('pendidikan');
                });
                const hasNasional = dayAgendas.some(a => String(a.jenis).toLowerCase().includes('nasional'));
                const hasIslami = dayAgendas.some(a => {
                  const t = String(a.jenis).toLowerCase();
                  return t.includes('islami') || t.includes('ibadah') || t.includes('yaumiyah');
                });
                
                let dayClasses = day.getDay() === 0 ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50';
                if (!isSameMonth(day, monthStart)) {
                  dayClasses = 'text-gray-300';
                } else if (isToday(day)) {
                  dayClasses = `${t.primaryBg} text-white font-bold shadow-md`;
                } else if (isHoliday || hasNasional) {
                  dayClasses = 'bg-red-50 text-red-700 font-bold border border-red-200';
                } else if (hasAkademik) {
                  dayClasses = 'bg-blue-50 text-blue-700 font-bold border border-blue-200';
                }

                const underlineClass = hasIslami 
                  ? (isToday(day) ? 'underline decoration-white decoration-2 underline-offset-4' : 'underline decoration-emerald-500 decoration-2 underline-offset-4') 
                  : '';

                return (
                  <div 
                    key={day.toString()} 
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all ${dayClasses}`}
                  >
                    <span className={`text-lg ${underlineClass}`}>{format(day, 'd')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2 px-2">
              <Info size={18} className={t.primaryText} />
              Daftar Agenda Bulan Ini
            </h4>
            
            {currentMonthAgenda.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                
                {/* Kartu Agenda Pendidikan */}
                {agendaPendidikan.length > 0 && (
                  <div className="bg-white border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-blue-200 pb-2">
                      <Book size={16} className="text-blue-600" />
                      <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">Agenda Pendidikan</span>
                    </div>
                    <ul className="space-y-3">
                      {agendaPendidikan.map((item, idx) => (
                        <li key={idx} className="flex flex-col">
                          <span className="font-bold text-blue-800 text-sm">{item.kegiatan}</span>
                          <span className="text-xs text-blue-600/80 font-medium">
                            {item.parsedDate ? format(item.parsedDate, 'dd MMMM yyyy', { locale: id }) : ''}
                            {String(item.is_libur).toUpperCase() === 'TRUE' && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm">Libur</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kartu Agenda Nasional */}
                {agendaNasional.length > 0 && (
                  <div className="bg-white border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-red-200 pb-2">
                      <Flag size={16} className="text-red-600" />
                      <span className="text-sm font-bold text-red-700 uppercase tracking-wider">Agenda Nasional</span>
                    </div>
                    <ul className="space-y-3">
                      {agendaNasional.map((item, idx) => (
                        <li key={idx} className="flex flex-col">
                          <span className="font-bold text-red-800 text-sm">{item.kegiatan}</span>
                          <span className="text-xs text-red-600/80 font-medium">
                            {item.parsedDate ? format(item.parsedDate, 'dd MMMM yyyy', { locale: id }) : ''}
                            <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm">Libur</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kartu Agenda Ibadah */}
                {agendaIbadah.length > 0 && (
                  <div className="bg-white border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
                      <Moon size={16} className="text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Agenda Ibadah</span>
                    </div>
                    <ul className="space-y-3">
                      {agendaIbadah.map((item, idx) => (
                        <li key={idx} className="flex flex-col">
                          <span className="font-bold text-emerald-800 text-sm">{item.kegiatan}</span>
                          <span className="text-xs text-emerald-600/80 font-medium">
                            {item.displayDate || (item.parsedDate ? format(item.parsedDate, 'dd MMMM yyyy', { locale: id }) : '')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-sm text-gray-500 italic text-center py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                Tidak ada agenda di bulan ini.
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
