import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RefreshCw, FileText, Users, CalendarCheck, X, MessageCircle, BarChart3, Building } from 'lucide-react';
import { ThemeConfig } from '../types';
import { SPMBModal } from '../components/SPMBModal';
import { GlobalRunningText } from '../components/GlobalRunningText';

const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s/gviz/tq?tqx=out:csv&sheet=dataSPMB';

interface SPMBData {
  tahun: string;
  kuota: number;
  pendaftar: number;
  sisaKuota: number;
  persentase: number;
  statusText: string;
  batasAkhir: string;
}

interface GlobalStats {
  alumni: number;
  siswaAktif: number;
  brochureUrl: string;
  waNumber: string;
  waMessage: string;
}

export function SPMBView({ t, onBack }: { t: ThemeConfig, onBack: () => void }) {
  const [data, setData] = useState<SPMBData[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ alumni: 0, siswaAktif: 0, brochureUrl: '', waNumber: '', waMessage: '' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [showBrochure, setShowBrochure] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setStatus('loading');
    try {
      const response = await fetch(SHEETS_CSV_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const csvText = await response.text();
      
      const rows = csvText.split('\n').map(row => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
            else current += char;
        }
        result.push(current.trim());
        return result;
      });

      const parsedData: SPMBData[] = [];
      const stats = { alumni: 0, siswaAktif: 0, brochureUrl: '', waNumber: '', waMessage: '' };

      if (rows.length > 1) {
          if (rows[1][7]) stats.alumni = parseInt(rows[1][7]) || 0;
          if (rows[1][8]) stats.siswaAktif = parseInt(rows[1][8]) || 0;
          if (rows[1][11]) stats.brochureUrl = rows[1][11].replace(/"/g, '');
          if (rows[1][12]) {
            let wa = rows[1][12].replace(/"/g, '').replace(/\D/g, '');
            if (wa.startsWith('0')) wa = '62' + wa.substring(1);
            stats.waNumber = wa;
          }
      }
      if (rows.length > 2) {
          if (rows[2][12]) stats.waMessage = rows[2][12].replace(/"/g, '');
      }
      setGlobalStats(stats);

      for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 7 && row[0]) {
              const tapel = row[0].replace(/"/g, '');
              let batasAkhir = row[6] ? row[6].replace(/"/g, '') : '';
              
              if (!batasAkhir && tapel) {
                  const startYear = tapel.split('/')[0];
                  if (startYear && !isNaN(Number(startYear))) {
                      batasAkhir = `31 Desember ${startYear}`;
                  }
              }

              parsedData.push({
                  tahun: tapel,
                  kuota: parseInt(row[1]) || 0,
                  pendaftar: parseInt(row[2]) || 0,
                  sisaKuota: (row[3] !== undefined && row[3] !== '') ? (parseInt(row[3]) || 0) : ((parseInt(row[1]) || 0) - (parseInt(row[2]) || 0)),
                  persentase: parseFloat((row[4] || '0').toString().replace(',', '.')) || 0,
                  statusText: row[5] ? row[5].replace(/"/g, '') : '', 
                  batasAkhir: batasAkhir
              });
          }
      }
      
      parsedData.sort((a, b) => {
          let yearA = parseInt(a.tahun.split('/')[0]);
          let yearB = parseInt(b.tahun.split('/')[0]);
          return yearB - yearA;
      });

      setData(parsedData);
      setStatus('connected');
    } catch (error) {
      console.error("Fetch error:", error);
      setData([
          { tahun: '2026/2027', kuota: 130, pendaftar: 45, sisaKuota: 85, persentase: 34.6, statusText: 'Buka', batasAkhir: '31 Desember 2026' },
          { tahun: '2025/2026', kuota: 125, pendaftar: 168, sisaKuota: 0, persentase: 100, statusText: 'Tutup', batasAkhir: '31 Desember 2025' }
      ]);
      setGlobalStats({ alumni: 1250, siswaAktif: 480, brochureUrl: '', waNumber: '6282333427597', waMessage: 'Halo Admin, saya ingin bertanya tentang pendaftaran.' });
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showBrochure) setShowBrochure(false);
        else if (showStats) setShowStats(false);
        else if (showModal) setShowModal(false);
        else onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, showBrochure, showStats, showModal]);

  const getRegistrationStatus = (item: SPMBData) => {
      if (item.statusText && (item.statusText.toLowerCase().includes('tutup') || item.statusText.toLowerCase().includes('closed'))) {
          return { isOpen: false, themeColor: 'red', statusMessage: 'Pendaftaran Ditutup', statusIcon: '🔒', countdownText: 'Ditutup Admin' };
      }
      if (item.sisaKuota <= 0) {
          return { isOpen: false, themeColor: 'red', statusMessage: 'Kuota Penuh', statusIcon: '🔒', countdownText: 'Penuh' };
      }

      const today = new Date();
      const months: Record<string, number> = {'Januari':0,'Februari':1,'Maret':2,'April':3,'Mei':4,'Juni':5,'Juli':6,'Agustus':7,'September':8,'Oktober':9,'November':10,'Desember':11};
      let targetDate: Date | null = null;

      try {
          const parts = item.batasAkhir.split(' ');
          if (parts.length >= 3) {
              const day = parseInt(parts[0]);
              const month = months[parts[1]];
              const year = parseInt(parts[2]);
              targetDate = new Date(year, month, day, 23, 59, 59);
          }
      } catch (e) { console.error(e); }

      if (!targetDate) return { isOpen: true, themeColor: 'gray', statusMessage: 'Info Tanggal Salah', statusIcon: '⚠️', countdownText: '-' };

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
          return { isOpen: false, themeColor: 'gray', statusMessage: 'Pendaftaran Ditutup', statusIcon: '🔒', countdownText: 'Selesai' };
      } else if (diffDays === 0) {
          return { isOpen: true, themeColor: 'orange', statusMessage: 'Hari Terakhir!', statusIcon: '⚠️', countdownText: 'Hari Ini' };
      } else {
          return { isOpen: true, themeColor: 'emerald', statusMessage: 'Pendaftaran Dibuka', statusIcon: '✨', countdownText: `${diffDays} Hari` };
      }
  };

  const selectedData = data[selectedIndex];
  const currentStatus = selectedData ? getRegistrationStatus(selectedData) : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center justify-between ${t.primaryBg} text-white shadow-md shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-lg leading-tight">Data SPMB</h2>
            <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">MIS IT Al Uswah</p>
          </div>
        </div>
        <div className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border ${
          status === 'loading' ? 'bg-yellow-500/20 text-yellow-100 border-yellow-500/30' : 
          status === 'connected' ? 'bg-green-500/20 text-green-100 border-green-500/30' : 
          'bg-red-500/20 text-red-100 border-red-500/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            status === 'loading' ? 'bg-yellow-400 animate-pulse' : 
            status === 'connected' ? 'bg-green-400' : 'bg-red-400'
          }`}></span> 
          <span className="hidden sm:inline">{status === 'loading' ? 'Memuat...' : status === 'connected' ? 'Online' : 'Offline'}</span>
          <span className="sm:hidden">{status === 'loading' ? '...' : status === 'connected' ? 'On' : 'Off'}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full pb-20 md:pb-6">
        {/* Header Widget */}
        <div className="w-full bg-white border-b border-gray-200 pt-3 pb-3">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${t.primaryBg}`}></div>
              <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                <div className="text-center md:text-left flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${t.primaryBg} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${t.primaryBg}`}></span>
                    </span>
                    <span className={`text-xs font-bold ${t.primaryText} tracking-wide uppercase`}>Pendaftaran Dibuka</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    Masa Depanmu, <span className={t.primaryText}>Dimulai Di Sini</span>
                  </h1>
                  <p className="text-gray-500 text-sm mt-1.5 max-w-xs mx-auto md:mx-0 leading-relaxed">
                    Yuk, bergabung dan menjadi bagian dari keluarga besar MIS IT Al Uswah! ✨ <br/> Mari bertumbuh bersama kami. 🫶
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0 min-w-[260px] mt-2 md:mt-0">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-gray-100 p-2 rounded-lg border border-gray-200 text-center shadow-sm">
                      <span className="block font-bold text-gray-800 text-lg leading-none">{globalStats.alumni.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold mt-1 block">Total Alumni</span>
                    </div>
                    <div className={`${t.primaryBg} p-2 rounded-lg border border-current/20 text-center shadow-md`}>
                      <span className="block font-bold text-white text-lg leading-none">{globalStats.siswaAktif.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-white/90 uppercase font-semibold mt-1 block">Siswa Aktif</span>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(true)} className={`w-full ${t.primaryBg} text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2`}>
                    <span>Daftar Sekarang</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 w-full">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tahun Pelajaran</h2>
              <button onClick={fetchData} className={`group text-xs ${t.primaryText} flex items-center gap-1 font-medium transition-colors ${t.primaryLightBg} px-2 py-1 rounded-md`}>
                <RefreshCw className={`w-3 h-3 transition-transform ${status === 'loading' ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                Refresh
              </button>
            </div>
            
            <div className="relative group -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none md:hidden z-10"></div>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar p-2 snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-0">
                {data.length === 0 ? (
                  <div className="flex space-x-2 w-full animate-pulse">
                    <div className="h-11 w-28 bg-gray-200 rounded-xl shrink-0"></div>
                    <div className="h-11 w-28 bg-gray-200 rounded-xl shrink-0"></div>
                    <div className="h-11 w-28 bg-gray-200 rounded-xl shrink-0"></div>
                  </div>
                ) : (
                  data.map((item, index) => {
                    const isActive = index === selectedIndex;
                    const itemStatus = getRegistrationStatus(item);
                    const activeClass = `${t.primaryBg} text-white shadow-lg ring-2 ring-offset-1 ring-current/30 transform scale-105`;
                    const inactiveClass = "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 hover:border-gray-300";
                    
                    return (
                      <button 
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 snap-start active:scale-95 ${isActive ? activeClass : inactiveClass}`}
                      >
                        <div className="flex flex-col items-start leading-none gap-0.5">
                          <span className="text-[9px] uppercase tracking-wider opacity-70">Tahun</span>
                          <span className="text-sm font-bold">{item.tahun.split('/')[0]}<span className="opacity-70 font-normal">/{item.tahun.split('/')[1]?.substr(2,2)}</span></span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="min-h-[300px]">
            {!selectedData || !currentStatus ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-2xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-24 bg-gray-200 rounded-xl"></div>
                  <div className="h-24 bg-gray-200 rounded-xl"></div>
                  <div className="h-24 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ) : (
              <motion.div 
                key={selectedIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 mb-6 relative overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none transform rotate-12">
                    <Users className={`w-40 h-40 ${t.primaryText}`} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border ${t.primaryLightBg} ${t.primaryText} border-current/20`}>
                          <span>{currentStatus.statusIcon}</span> {currentStatus.statusMessage}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">T.P. {selectedData.tahun}</h2>
                        <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1">
                          <span className="font-semibold text-gray-700">Deadline: {selectedData.batasAkhir || '-'}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 self-start w-full md:w-auto">
                        <div className={`p-2 bg-white rounded-lg shadow-sm ${t.primaryText}`}>
                          <CalendarCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Sisa Waktu</p>
                          <p className={`text-lg font-bold leading-none ${t.primaryText}`}>{currentStatus.countdownText}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                      <div className={`p-4 rounded-xl bg-gradient-to-br border border-solid shadow-lg flex items-center justify-between group ${t.primaryLightBg} border-current/10`}>
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 opacity-70 ${t.primaryText}`}>Sisa Kuota</p>
                          <p className={`text-3xl font-bold group-hover:scale-110 transition-transform origin-left ${t.primaryText}`}>{selectedData.sisaKuota}</p>
                        </div>
                        <div className={`${t.primaryText} opacity-30`}>
                          <Users className="w-10 h-10" />
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-white border border-solid border-gray-200 shadow-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pendaftar</p>
                          <p className="text-3xl font-bold text-gray-800">{selectedData.pendaftar}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-white border border-solid border-gray-200 shadow-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Kuota</p>
                          <p className="text-3xl font-bold text-gray-800">{selectedData.kuota}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-bold text-gray-700">Terisi {selectedData.persentase}%</span>
                        <span className="text-gray-500 font-medium">{selectedData.pendaftar} dari {selectedData.kuota} Siswa</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div className={`h-2.5 rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${t.primaryBg}`} style={{ width: `${selectedData.persentase}%` }}>
                          <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  <button onClick={() => window.open(`https://wa.me/${globalStats.waNumber}?text=${encodeURIComponent(globalStats.waMessage)}`, '_blank')} 
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-gray-200 ${t.primaryText} font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 touch-manipulation`}>
                    <MessageCircle className="w-5 h-5" /> Hubungi Admin
                  </button>
                  
                  <button onClick={() => setShowStats(true)} 
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-gray-200 ${t.primaryText} font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 touch-manipulation`}>
                    <BarChart3 className="w-5 h-5" /> Lihat Statistik
                  </button>
                  
                  <button onClick={() => setShowBrochure(true)} 
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 ${t.primaryBg} border border-transparent text-white font-bold rounded-xl shadow-md active:scale-95 touch-manipulation sm:col-span-2 md:col-span-1`}>
                    <FileText className="w-5 h-5" /> Lihat Brosur
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showBrochure && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0"
          >
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowBrochure(false)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="bg-white px-4 py-4 border-b flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5"/> Brosur Digital</h3>
                <button onClick={() => setShowBrochure(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto bg-gray-50 flex-grow">
                <div className="flex items-center justify-center min-h-[50vh]">
                  <img src={globalStats.brochureUrl || "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7TTjOV3250sxJgXyVMTGvmzW41JUAbIKUb1W83-nh7gNQACd2RqhQLDgRcZSSKVkbloiapOEXjQxn0nr1wkGb55W6xTgFxB1xyB0AYNJkhQwY7ZvcMTEHbVXo8Jlz456wXZBPoFHvYMUnSU0oIJgmTtwKNpsoiPcLzrie134k3mUyXHaB4H3KGgq_Ccuv/s1280/photo_.%20950_y%20(1).jpg"} 
                       className="max-w-full h-auto object-contain rounded-lg shadow-sm" alt="Brosur SPMB" />
                </div>
              </div>
              <div className="bg-white px-4 py-4 border-t grid grid-cols-2 gap-3 shrink-0">
                <a href={`https://wa.me/${globalStats.waNumber}?text=${encodeURIComponent(globalStats.waMessage)}`} target="_blank" rel="noreferrer" className={`flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm font-bold ${t.primaryText} shadow-sm hover:bg-gray-50 transition-all active:scale-95`}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <a href="https://www.misitaluswah.sch.id/p/registrasi.html" target="_blank" rel="noreferrer" className={`flex items-center justify-center gap-2 rounded-xl ${t.primaryBg} px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all active:scale-95`}>
                  <FileText className="w-4 h-4" /> Daftar
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showStats && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0"
          >
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowStats(false)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="bg-white px-4 py-4 border-b flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-5 h-5"/> Statistik Data SPMB</h3>
                  <p className="text-xs text-gray-500">Rekapitulasi pendaftaran dari tahun ke tahun</p>
                </div>
                <button onClick={() => setShowStats(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto bg-white flex-grow">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className={`${t.primaryLightBg} p-3 rounded-xl border border-current/10 flex flex-col items-center text-center shadow-sm`}>
                    <CalendarCheck className={`${t.primaryText} mb-1 w-6 h-6`} />
                    <span className={`text-lg font-bold ${t.primaryText} leading-none`}>{data.length}</span>
                    <span className={`text-[10px] ${t.primaryText} font-bold uppercase tracking-wide mt-1`}>Tahun</span>
                  </div>
                  <div className={`${t.primaryLightBg} p-3 rounded-xl border border-current/10 flex flex-col items-center text-center shadow-sm`}>
                    <Users className={`${t.primaryText} mb-1 w-6 h-6`} />
                    <span className={`text-lg font-bold ${t.primaryText} leading-none`}>{data.reduce((acc, curr) => acc + curr.pendaftar, 0)}</span>
                    <span className={`text-[10px] ${t.primaryText} font-bold uppercase tracking-wide mt-1`}>Pendaftar</span>
                  </div>
                  <div className={`${t.primaryLightBg} p-3 rounded-xl border border-current/10 flex flex-col items-center text-center shadow-sm`}>
                    <Building className={`${t.primaryText} mb-1 w-6 h-6`} />
                    <span className={`text-lg font-bold ${t.primaryText} leading-none`}>{data.reduce((acc, curr) => acc + curr.kuota, 0)}</span>
                    <span className={`text-[10px] ${t.primaryText} font-bold uppercase tracking-wide mt-1`}>Kapasitas</span>
                  </div>
                  <div className={`${t.primaryLightBg} p-3 rounded-xl border border-current/10 flex flex-col items-center text-center shadow-sm`}>
                    <BarChart3 className={`${t.primaryText} mb-1 w-6 h-6`} />
                    <span className={`text-lg font-bold ${t.primaryText} leading-none`}>{Math.round(data.reduce((acc, curr) => acc + curr.pendaftar, 0) / (data.length || 1))}</span>
                    <span className={`text-[10px] ${t.primaryText} font-bold uppercase tracking-wide mt-1`}>Rerata</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tahun</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kuota</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pendaftar</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Persen</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((item, idx) => {
                          const status = getRegistrationStatus(item);
                          return (
                            <tr key={idx}>
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.tahun}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.kuota}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 font-bold">{item.pendaftar}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.persentase}%</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                  status.statusMessage === 'Pendaftaran Dibuka' ? `${t.primaryLightBg} ${t.primaryText}` : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {status.statusMessage === 'Pendaftaran Dibuka' ? 'Buka' : 'Tutup'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t text-center sm:text-right">
                <button type="button" className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={() => setShowStats(false)}>Tutup</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showModal && (
          <SPMBModal t={t} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
