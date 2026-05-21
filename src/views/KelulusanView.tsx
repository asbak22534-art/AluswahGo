import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, GraduationCap, Sparkles, User, Calendar, Check, Award, AlertCircle, Loader2, Share2, Copy, Send, HelpCircle, X, Download, Instagram, Facebook, MessageCircle, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeConfig } from '../types';

export interface KelulusanStudent {
  nisn: string;
  name: string;
  kelas: string;
  waliKelas: string;
  tahunPelajaran: string;
  status: string;
  caption: string;
}

export function KelulusanView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const [nisn, setNisn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(() => !!localStorage.getItem('savedKelulusanNisn'));
  const [error, setError] = useState('');
  const [student, setStudent] = useState<KelulusanStudent | null>(null);
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('kelulusan_logoUrl') || 'https://i.ibb.co.com/spQcyWD5/Logo-MIS-IT-Al-Uswah.png');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('kelulusan_schoolName') || '');
  const [schoolVisi, setSchoolVisi] = useState(() => localStorage.getItem('kelulusan_schoolVisi') || '');
  
  // Custom states for interactive social panel
  const [copied, setCopied] = useState(false);
  const [showInstaGuide, setShowInstaGuide] = useState(false);

  const SHEET_ID = '1MdnB4JZsvhggmtFdLyoYjV1a6VeVlvVaaqP6JqSIjHE';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    const fetchProfilData = async () => {
      try {
        const profilCsvUrl = 'https://docs.google.com/spreadsheets/d/1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s/export?format=csv&gid=243742219';
        const response = await fetch(`${profilCsvUrl}&t=${new Date().getTime()}`);
        if (!response.ok) return;
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            if (row[i] === '"') {
              inQuotes = !inQuotes;
            } else if (row[i] === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += row[i];
            }
          }
          result.push(current.trim());
          return result;
        });

        // B2 (Row 2, index 1) is Nama Sekolah
        if (rows.length > 1) {
          const valName = rows[1][1]?.replace(/"/g, '').trim();
          if (valName) {
            setSchoolName(valName);
            localStorage.setItem('kelulusan_schoolName', valName);
          }
        }

        // B4 (Row 4, index 3) is Visi
        if (rows.length > 3) {
          const valVisi = rows[3][1]?.replace(/"/g, '').trim();
          if (valVisi) {
            setSchoolVisi(valVisi);
            localStorage.setItem('kelulusan_schoolVisi', valVisi);
          }
        }

        // B20 (Row 20, index 19) is Logo
        if (rows.length > 19) {
          const valLogo = rows[19][1]?.replace(/"/g, '').trim();
          if (valLogo && valLogo.startsWith('http')) {
            setLogoUrl(valLogo);
            localStorage.setItem('kelulusan_logoUrl', valLogo);
          }
        }
      } catch (error) {
        console.error("Failed to fetch custom profil from Google Sheet", error);
      }
    };
    fetchProfilData();

    const savedNisn = localStorage.getItem('savedKelulusanNisn');
    if (savedNisn) {
      setNisn(savedNisn);
      fetchStudentData(savedNisn).finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, []);

  // Trigger custom celebratory canvas-confetti on successful load
  useEffect(() => {
    if (student && student.status?.toUpperCase() === 'LULUS') {
      // First, immediate sweet confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Then trigger nice side-launches for an extra immersive celebration (perfect for both mobile and desktop)
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 25,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 }
        });
        confetti({
          particleCount: 25,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [student]);

  const fetchStudentData = async (inputNisn: string) => {
    setIsLoading(true);
    setError('');

    const normalizedInputNisn = inputNisn.trim();

    try {
      const q = `select * where A = '${normalizedInputNisn}'`;
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&tq=${encodeURIComponent(q)}`;
      
      const res = await fetch(url);
      const text = await res.text();
      const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      let parsedData = JSON.parse(jsonString);

      // Try fallback to number search if string search returns nothing and input is numeric
      if ((!parsedData.table || !parsedData.table.rows || parsedData.table.rows.length === 0) && /^\d+$/.test(normalizedInputNisn)) {
        const fallbackQ = `select * where A = ${normalizedInputNisn}`;
        const fallbackUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&tq=${encodeURIComponent(fallbackQ)}`;
        
        const fbRes = await fetch(fallbackUrl);
        const fbText = await fbRes.text();
        const fbJsonString = fbText.substring(fbText.indexOf('{'), fbText.lastIndexOf('}') + 1);
        parsedData = JSON.parse(fbJsonString);
      }

      if (!parsedData.table || !parsedData.table.rows || parsedData.table.rows.length === 0) {
        setError('NISN tidak ditemukan. Silakan periksa kembali nomor NISN Anda.');
        setStudent(null);
        localStorage.removeItem('savedKelulusanNisn');
        return;
      }

      const getCellVal = (row: any, colIdx: number) => {
        if (!row || !row.c || !row.c[colIdx]) return '';
        const cell = row.c[colIdx];
        if (cell === null || cell.v === null || cell.v === undefined) return '';
        return String(cell.f !== undefined ? cell.f : cell.v).trim();
      };

      const row = parsedData.table.rows[0];
      const foundStudent: KelulusanStudent = {
        nisn: getCellVal(row, 0),
        name: getCellVal(row, 1) || 'Siswa Tanpa Nama',
        kelas: getCellVal(row, 2) || '-',
        waliKelas: getCellVal(row, 3) || '-',
        tahunPelajaran: getCellVal(row, 4) || '-',
        status: getCellVal(row, 5) || 'Belum Ditentukan',
        caption: getCellVal(row, 6) || ''
      };

      setStudent(foundStudent);
      localStorage.setItem('savedKelulusanNisn', normalizedInputNisn);
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungkan ke database kelulusan. Pastikan koneksi internet stabil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim()) {
      setError('Masukkan NISN terlebih dahulu');
      return;
    }
    fetchStudentData(nisn);
  };

  const handleClear = () => {
    setStudent(null);
    setNisn('');
    localStorage.removeItem('savedKelulusanNisn');
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp share utility
  const handleShareWhatsApp = () => {
    if (!student) return;
    const currentSchool = schoolName || 'sekolah';
    const msg = `Alhamdulillah! Selamat atas kelulusan *${student.name}* (NISN: ${student.nisn}) dari ${currentSchool} tahun pelajaran ${student.tahunPelajaran} dengan status *${student.status.toUpperCase()}*! 🎉✨\n\n"${student.caption || 'Semoga sukses selalu di jenjang berikutnya!'}"\n\nCek pengumuman lengkapnya langsung lewat AlUswahGO!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Facebook share utility
  const handleShareFacebook = () => {
    if (!student) return;
    const currentSchool = schoolName || 'sekolah';
    const shareUrl = window.location.origin;
    const msg = `Alhamdulillah! Selamat atas kelulusan ${student.name} (NISN: ${student.nisn}) dari ${currentSchool} tahun pelajaran ${student.tahunPelajaran} dengan status ${student.status.toUpperCase()}! 🎉`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(msg)}`, '_blank');
  };

  // Clipboard copy utility
  const handleCopyText = () => {
    if (!student) return;
    const currentSchool = schoolName || 'sekolah';
    const msg = `Alhamdulillah! Selamat atas kelulusan ${student.name} (NISN: ${student.nisn}) dari ${currentSchool} tahun pelajaran ${student.tahunPelajaran} dengan status ${student.status.toUpperCase()}! 🎉✨\n\n"${student.caption || 'Semoga sukses selalu di jenjang berikutnya!'}"`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLulus = student?.status?.toUpperCase() === 'LULUS';

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#FFFDFB] z-50 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md text-gray-850 shadow-sm shrink-0 print:hidden">
        <button onClick={student ? handleClear : onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center max-w-[calc(100%-80px)]">
          <img 
            src={logoUrl} 
            alt="Logo Al Uswah" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" 
            onError={(e) => { e.currentTarget.src = "/logo.png" }}
          />
          <div className="flex flex-col text-left overflow-hidden min-w-0">
            <h2 className="font-poppins font-semibold text-xs sm:text-base md:text-lg text-slate-800 tracking-tight leading-none truncate whitespace-nowrap">
              {schoolName}
            </h2>
            <p className="text-[7.5px] sm:text-[9px] md:text-[10px] text-slate-500 font-medium truncate tracking-wide mt-1 leading-none" title={schoolVisi}>
              {schoolVisi}
            </p>
          </div>
        </div>
        
        <div className="w-10 h-10 flex-shrink-0" /> {/* Spacer to align center */}
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto w-full pb-24 print:pb-0 font-sans print:overflow-visible bg-gradient-to-br from-cyan-50/35 via-white to-amber-50/45">
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full flex flex-col items-center">
          
          {isInitializing ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
              <Loader2 className={`w-10 h-10 animate-spin ${t.primaryText}`} />
              <p className="text-gray-500 font-medium">Memuat data kelulusan...</p>
            </div>
          ) : !student ? (
            /* Search Card Form */
            <motion.div 
              key="search-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/75 backdrop-blur-xl border border-white/95 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-cyan-500/5 w-full max-w-md mt-4 md:mt-8 relative overflow-hidden group print:hidden"
            >
              <div className={`absolute right-0 top-0 w-32 h-32 ${t.primaryBg} opacity-5 rounded-bl-full -z-0 transition-transform duration-500 group-hover:scale-110`}></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-tr from-cyan-500 to-amber-400 text-white shadow-lg shadow-cyan-200/40`}>
                  <GraduationCap size={32} />
                </div>
                <h3 className="text-2xl font-black text-center text-gray-800 mb-2 font-sans tracking-tight">Portal Kelulusan</h3>
                <p className="text-center text-gray-500 text-xs md:text-sm mb-6 leading-relaxed">
                  Masukkan Nomor Induk Siswa Nasional (NISN) untuk melihat surat pengumuman resmi dan status kelulusan Kelas 6.
                </p>

                <form onSubmit={handleSearchSubmit} className="space-y-4 w-full">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">NISN Anda</label>
                    <div className="relative group/input">
                      {/* Interactive Border */}
                      <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${error ? 'bg-red-400' : 'bg-gray-200/80 group-focus-within/input:bg-gradient-to-r group-focus-within/input:from-cyan-400 group-focus-within/input:to-amber-400'}`}></div>
                      
                      {/* Inner background spacer */}
                      <div className="absolute inset-[2px] bg-[#FCF8F5] group-focus-within/input:bg-white rounded-[14px] transition-colors duration-300"></div>

                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <User size={18} className={`transition-colors duration-300 ${error ? 'text-red-500' : 'text-gray-400 group-focus-within/input:text-cyan-500'}`} />
                      </div>

                      <input
                        type="text"
                        value={nisn}
                        onChange={(e) => {
                          setNisn(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Contoh: 3132070291"
                        maxLength={20}
                        className="relative w-full pl-11 pr-4 py-3.5 bg-transparent text-gray-800 font-bold placeholder-gray-400 !outline-none !border-none !ring-0 !shadow-none z-10 text-sm"
                        style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-xs text-red-650 flex items-center gap-1.5 font-semibold leading-relaxed">
                        <AlertCircle size={14} className="shrink-0" /> {error}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-amber-500 hover:opacity-95 text-white font-extrabold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 shadow-md shadow-cyan-500/10 text-sm mt-2"
                  >
                    {isLoading ? (
                      <><Loader2 size={18} className="animate-spin" /> Sedang Memeriksa...</>
                    ) : (
                      <><Search size={18} /> Lihat Hasil Kelulusan</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* Result View: Sunny Pastel Glassmorphism Custom Instagram Story frame style */
            <div className="w-full relative flex flex-col items-center">

              {/* Announcement Letter Container in Glassmorphic design */}
              <motion.div
                key="announcement-letter"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-[3rem] p-6 sm:p-10 shadow-[0_32px_60px_rgba(6,182,212,0.05)] w-full relative z-10 overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col items-center text-center animate-fade-in"
              >
                {/* Official Elegant Graphic BG for aesthetic view */}
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-tr from-cyan-400/10 via-teal-300/10 to-amber-400/10 rounded-full blur-2xl -z-10 pointer-events-none"></div>
                <div className="absolute -left-12 bottom-12 w-44 h-44 bg-gradient-to-br from-cyan-300/10 via-teal-200/5 to-amber-300/15 rounded-full blur-2xl -z-10 pointer-events-none"></div>

                {/* Small Welcome banner */}
                <span className="text-xs sm:text-sm font-display font-extrabold tracking-[0.1em] text-cyan-700 bg-cyan-50/50 px-4 py-1.5 rounded-full border border-cyan-100/70 mb-5 shadow-sm">
                  Selamat dan Sukses
                </span>

                {/* Kartu Status Kelulusan - PUSAT FOKUS */}
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
                  className="mb-6 bg-gradient-to-br from-cyan-50/90 via-white/95 to-amber-50/90 backdrop-blur-xl border border-cyan-100/50 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden w-full max-w-sm mx-auto shadow-md"
                >
                  {/* Confetti & Toga explosion overlay icon - Multi-sparkle Radiant glow */}
                  <div className="relative mb-6 flex items-center justify-center scale-105">
                    {/* Glowing outer aura overlays */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 to-amber-400/30 blur-2xl rounded-full scale-150 animate-pulse duration-1000"></div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-450 rounded-[24px] blur opacity-40 animate-pulse"></div>
                    
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-400 to-amber-500 text-white flex items-center justify-center shadow-lg relative z-10 duration-300 hover:scale-110">
                      <GraduationCap className="w-9 h-9 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>

                    {/* Highly cheerful surrounding sparkles */}
                    <Sparkles className="absolute -top-3.5 -right-3.5 text-amber-500 w-6 h-6 animate-bounce filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]" />
                    <Sparkles className="absolute -bottom-3.5 -left-3.5 text-cyan-400 w-5 h-5 animate-bounce delay-300 filter drop-shadow-[0_2px_4px_rgba(34,211,238,0.5)]" />
                    <Sparkles className="absolute -top-3.5 -left-3.5 text-cyan-500 w-5 h-5 animate-ping delay-150 filter drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]" />
                    <Sparkles className="absolute -bottom-3.5 -right-3.5 text-amber-400 w-5.5 h-5.5 animate-bounce delay-500 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)]" />
                  </div>

                  {/* Di bawah logo Topi, sematkan nama siswa dan NISN */}
                  <div className="flex flex-col items-center mb-4 text-center px-1">
                    <h3 className="text-base sm:text-lg font-sans font-bold text-slate-800 tracking-tight leading-snug">
                      {student.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-500 mt-1.5 tracking-wider bg-slate-100/70 px-2.5 py-0.5 rounded-full border border-white/55">
                      NISN: {student.nisn}
                    </p>
                  </div>

                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 font-mono mb-1">Status Kelulusan</span>
                  
                  {/* Glowing, Shimmering Status Badge */}
                  <div className="relative flex items-center justify-center my-1 ml-auto mr-auto px-6 py-2 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-amber-500/10 border border-cyan-200/45 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.08)] overflow-hidden w-full max-w-[240px]">
                    {/* Sparkling light reflection sweeping overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer pointer-events-none z-20"></div>
                    
                    <h4 className="text-2xl sm:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-amber-500 tracking-widest uppercase relative z-10 filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.3)]">
                      {student.status}
                    </h4>

                    {/* Sparkle details side-by-side inside ribbon */}
                    <Sparkles className="absolute left-2 text-cyan-500 w-4 h-4 animate-pulse" />
                    <Sparkles className="absolute right-2 text-amber-500 w-4 h-4 animate-pulse delay-500" />
                  </div>
                  
                  {student.caption ? (
                    <p className="text-cyan-800 text-xs sm:text-sm font-serif-elegant font-bold italic mt-3 leading-relaxed text-center px-1">
                      "{student.caption}"
                    </p>
                  ) : isLulus ? (
                    <p className="text-cyan-800 text-sm sm:text-base font-serif-elegant font-bold italic mt-3 leading-relaxed text-center px-1">
                      "Selamat & Sukses ya nak. Teruslah Bersinar!"
                    </p>
                  ) : null}
                </motion.div>

                {/* Profil Kartu Ramping di bagian bawah */}
                <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 font-mono text-center">Detail Profil Alumni</span>
                  
                  <div className="bg-white/60 backdrop-blur-md border border-slate-100/80 rounded-2xl p-4.5 flex flex-col gap-3 text-left shadow-sm">
                    {/* Tahun Kelulusan (kolom E) */}
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex justify-between items-center w-full min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">Tahun Kelulusan</span>
                        <span className="text-slate-700 font-semibold ml-4 text-right">{student.tahunPelajaran}</span>
                      </div>
                    </div>

                    {/* Kelas */}
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm border-t border-slate-100/50 pt-3">
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex justify-between items-center w-full min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">Kelas</span>
                        <span className="text-slate-700 font-semibold ml-4 text-right">{student.kelas}</span>
                      </div>
                    </div>

                    {/* Wali Kelas */}
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm border-t border-slate-100/50 pt-3">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex justify-between items-center w-full min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">Wali Kelas</span>
                        <span className="text-slate-700 font-semibold ml-4 text-right">{student.waliKelas}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verified Banner */}
                <div className="mt-6 pt-5 w-full border-t border-slate-100/80 flex items-center justify-center">
                  <div className="font-black text-[10px] text-emerald-600 italic flex items-center gap-1.5 bg-emerald-50 py-1.5 px-4 rounded-full border border-emerald-100/50 shadow-sm">
                    <Check size={12} className="text-emerald-500 shrink-0" /> Terverifikasi Sistem Al Uswah
                  </div>
                </div>

              </motion.div>

              {/* Call to Action: Minimalist Social Share Circles */}
              <div className="mt-8 w-full max-w-sm bg-white/45 backdrop-blur-md border border-white/60 rounded-[2rem] p-5 shadow-lg shadow-cyan-500/5 flex flex-col items-center gap-3.5 print:hidden">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 font-mono">Bagikan Kabar Gembira</span>
                
                <div className="flex items-center justify-center gap-4 w-full">
                  {/* WhatsApp */}
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-12 h-12 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-all duration-300 active:scale-95 border border-emerald-100/30 shadow-sm"
                    title="Bagikan ke WhatsApp"
                  >
                    <MessageCircle size={20} className="shrink-0" />
                  </button>

                  {/* Instagram Story Helper */}
                  <button
                    onClick={() => setShowInstaGuide(true)}
                    className="w-12 h-12 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 flex items-center justify-center transition-all duration-300 active:scale-95 border border-pink-100/30 shadow-sm"
                    title="Panduan Instagram Story"
                  >
                    <Instagram size={20} className="shrink-0" />
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={handleShareFacebook}
                    className="w-12 h-12 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all duration-300 active:scale-95 border border-blue-100/30 shadow-sm"
                    title="Bagikan ke Facebook"
                  >
                    <Facebook size={20} className="shrink-0" />
                  </button>

                  {/* Copy Link / Text Utility */}
                  <button
                    onClick={handleCopyText}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 border shadow-sm ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/50'}`}
                    title="Salin Pesan"
                  >
                    {copied ? <Check size={20} className="shrink-0" /> : <Copy size={20} className="shrink-0" />}
                  </button>
                </div>
                
                {copied && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-emerald-600 font-extrabold font-mono"
                  >
                    Pesan kelulusan berhasil disalin!
                  </motion.p>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Modern Instagram Story Sharing Helper Modal dialog popup */}
      <AnimatePresence>
        {showInstaGuide && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm print:hidden"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white rounded-[2rem] max-w-sm w-full p-6 shadow-2xl relative border border-gray-100"
            >
              <button 
                onClick={() => setShowInstaGuide(false)} 
                className="absolute top-4 right-4 p-1.5 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-100/50 mb-4 text-2xl">
                  📸
                </div>
                <h4 className="text-lg font-black text-gray-800 mb-2">Tips Instagram Story</h4>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">
                  Ingin kelulusanmu terlihat estetis di media sosial? Simpan dalam 3 langkah mudah:
                </p>

                <div className="space-y-3.5 text-left w-full mb-6">
                  <div className="flex items-start gap-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">1</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                      Ambil <strong>screenshot (tangkapan layar)</strong> dari halaman kelulusan cantik di belakang layar ini.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">2</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                      Buka aplikasi <strong>Instagram Stories</strong> Anda, lalu pilih file gambar screenshot tersebut.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-black">3</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                      Tambahkan <strong>Stiker Musik</strong> bertema kelulusan (seperti <i>"Lagu Kelulusan"</i>) agar postinganmu makin seru!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowInstaGuide(false)}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 font-extrabold py-3 rounded-xl transition-all shadow-md active:scale-95 text-xs text-center"
                >
                  Keren, Coba Sekarang!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
