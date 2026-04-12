import os

content = """import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ThemeConfig } from '../types';
import { 
  ArrowLeft, ChevronDown, ChevronRight, Check, X, Plus, Minus, 
  RotateCcw, Send, Copy, Loader2, Droplets, Lock, User, Shield, 
  TrendingUp, TrendingDown, Star, CheckCircle, AlertCircle, 
  BarChart2, Folder, Search, RefreshCw, Trophy, UploadCloud, 
  Link as LinkIcon, FileSpreadsheet, MessageCircle, Settings, Save 
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const CURRENT_MONTH_IDX = new Date().getMonth();
const CURRENT_MONTH_NAME = MONTH_NAMES[CURRENT_MONTH_IDX];

const MOCK_GURU = [{ id: 1, nama: "Ustadz Simulasi", gender: "L", phone: "08123456789" }, { id: 2, nama: "Ustadzah Simulasi", gender: "P", phone: "08123456789" }];

const PIN_GURU = ""; 
const YAUMIYAH_GAS_URL = 'https://script.google.com/macros/s/AKfycbyfS9W7SwAatehPbuQcJYj3T7ROEaRSd9wHrzaA5dgVN5l7zgkRp8LpMkDooaNcMh_C/exec';

const normalize = (str: any) => {
  if (str === null || str === undefined) return "";
  return String(str).toLowerCase().replace(/[\\u200B-\\u200D\\uFEFF\\u00A0]/g, ' ').replace(/\\s+/g, ' ').trim();
};

const normalizePekan = (val: any) => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'number') return String(val);
  const str = String(val);
  const digits = str.replace(/\\D/g, ''); 
  return digits ? String(Number(digits)) : ""; 
};

const mapRow = (r: any[]) => {
    if(!r || !Array.isArray(r)) return {};
    const parseVal = (v: any) => {
       if (v === 'Ya' || v === 'ya' || v === true) return 1;
       if (v === 'Tidak' || v === 'tidak' || v === false) return 0;
       const n = Number(v);
       return isNaN(n) ? 0 : n;
    };
    
    const isLink = (val: any) => typeof val === 'string' && val.includes('http');
    const valPerangkat = isLink(r[17]) ? 1 : parseVal(r[17]);

    return {
        targetSholatJamaah: parseVal(r[4]), sholatJamaah: parseVal(r[5]), 
        targetSholatMalam: parseVal(r[6]), sholatMalam: parseVal(r[7]),   
        targetSholatDhuha: parseVal(r[8]), sholatDhuha: parseVal(r[9]),   
        targetTilawah: parseVal(r[10]), tilawah: parseVal(r[11]),
        targetPuasaSenin: parseVal(r[12]), puasaSenin: parseVal(r[13]),
        targetPuasaKamis: parseVal(r[14]), puasaKamis: parseVal(r[15]),
        targetPerangkat: parseVal(r[16]), perangkat: valPerangkat,
        targetDzikir: parseVal(r[18]), dzikir: parseVal(r[19]),
        targetMendoakan: parseVal(r[20]), mendoakan: parseVal(r[21]),
        targetInfaq: parseVal(r[22]), infaq: parseVal(r[23]),
        targetBacaBuku: parseVal(r[24]), bacaBuku: parseVal(r[25]),
        targetOlahraga: parseVal(r[26]), olahraga: parseVal(r[27]),
        targetMenyapa: parseVal(r[28]), menyapaSiswa: parseVal(r[29])
    };
};

const processRawData = (dataFromBackend: any[]) => {
  if (!Array.isArray(dataFromBackend)) return [];
  return dataFromBackend.map(item => {
      return {
          ...item,
          _normNama: normalize(item.nama),
          _normBulan: normalize(item.bulan),
          _normPekan: normalizePekan(item.pekan), 
          mapped: item.raw ? mapRow(item.raw) : {} 
      };
  }).filter(item => item.nama); 
};

const CATEGORIES = {
  ibadah: { label: "Ibadah Utama", items: ['sholatJamaah', 'sholatMalam', 'sholatDhuha', 'tilawah', 'puasaSenin', 'puasaKamis'] },
  profesional: { label: "Profesional & Dzikir", items: ['perangkat', 'dzikir'] },
  sosial: { label: "Sosial & Lainnya", items: ['mendoakan', 'infaq', 'bacaBuku', 'olahraga', 'menyapaSiswa'] }
};

const ITEM_LABELS: any = {
  sholatJamaah: "Sholat Jamaah", sholatMalam: "Sholat Malam", sholatDhuha: "Sholat Dhuha", tilawah: "Tilawah",
  puasaSenin: "Puasa Senin", puasaKamis: "Puasa Kamis", perangkat: "Perangkat Ajar", dzikir: "Dzikir",
  mendoakan: "Mendoakan", infaq: "Infaq", bacaBuku: "Baca Buku", olahraga: "Olahraga", menyapaSiswa: "Menyapa Siswa"
};

const useLongPress = (callback: () => void, ms = 150) => {
  const timerRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  const startPress = () => {
    if (timeoutRef.current) return;
    timeoutRef.current = setTimeout(() => {
      timerRef.current = setInterval(callback, ms);
    }, 300); 
  };

  const stopPress = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(timerRef.current);
    timeoutRef.current = null;
    timerRef.current = null;
  };

  return { onMouseDown: startPress, onMouseUp: stopPress, onMouseLeave: stopPress, onTouchStart: startPress, onTouchEnd: stopPress };
};

const Toast = ({ message, type, onClose }: { message: string, type: string, onClose: () => void }) => {
  useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [onClose]); 
  const isSuccess = type === 'success';
  return (
    <div className="fixed bottom-10 left-4 right-4 z-[200] flex justify-center pointer-events-none">
      <div className={`animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl pointer-events-auto ${isSuccess ? 'bg-slate-800 text-white' : 'bg-rose-500 text-white'}`}>
        {isSuccess ? <CheckCircle className="text-teal-400" size={20} /> : <AlertCircle className="text-white" size={20} />}
        <span className="font-medium text-sm text-left">{message}</span>
      </div>
    </div>
  );
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm transition-opacity duration-200">
     <div className="bg-white p-5 rounded-3xl shadow-xl flex flex-col items-center animate-in zoom-in duration-200 border border-slate-200">
        <Loader2 size={40} className="text-teal-700 animate-spin mb-3"/>
        <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Memuat Data...</span>
     </div>
  </div>
);

const ScoreCircle = ({ score, label, subLabel, size = "md", t }: any) => {
    const r = size === "lg" ? 40 : 30;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    const color = score >= 80 ? t.primaryText : score >= 50 ? 'text-amber-600' : 'text-rose-600';
    
    return (
        <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
                <svg className="transform -rotate-90" width={size==="lg"?100:80} height={size==="lg"?100:80}>
                    <circle cx={size==="lg"?50:40} cy={size==="lg"?50:40} r={r} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200" />
                    <circle cx={size==="lg"?50:40} cy={size==="lg"?50:40} r={r} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className={`${color} transition-all duration-1000`} />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className={`font-black ${size==="lg"?"text-2xl":"text-lg"} text-slate-900`}>{score}%</span>
                </div>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">{label}</span>
            {subLabel && <span className="text-[10px] text-slate-500">{subLabel}</span>}
        </div>
    );
};

const StatItem = ({ label, pct, cap, tar, t }: any) => {
    const getGrade = (p: number) => {
        if (p >= 100) return "Sempurna";
        if (p >= 80) return "Istiqomah";
        if (p >= 60) return "Baik";
        if (p >= 40) return "Cukup";
        return "Perlu Ditingkatkan";
    };

    const colorClass = pct >= 80 ? t.primaryBg : pct >= 50 ? 'bg-amber-500' : 'bg-rose-600';
    const textClass = pct >= 80 ? t.primaryText : pct >= 50 ? 'text-amber-800' : 'text-rose-800';
    const bgClass = pct >= 80 ? t.primaryLightBg : pct >= 50 ? 'bg-amber-100' : 'bg-rose-100';

    return (
       <div className="mb-4 bg-white rounded-xl border border-slate-300 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${bgClass} ${textClass}`}>
                  {getGrade(pct)}
              </div>
          </div>
          
          <div className="flex items-end justify-between mb-2">
               <div className="text-xs text-slate-600 font-medium">
                  Target: <span className="text-slate-900 font-bold">{tar}</span> <span className="text-slate-400 mx-1">/</span> Capaian: <span className="text-slate-900 font-bold">{cap}</span>
               </div>
               <span className={`text-xl font-black ${textClass}`}>{pct}%</span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} style={{width: `${pct}%`}}></div>
          </div>
       </div>
    );
};

const CounterInput = ({ label, value, target, onChange, onTargetChange, unit = "", noTargetLimit = false, isDisabled = false, t }: any) => {
    const inc = () => !isDisabled && onChange((!noTargetLimit && value + 1 > target) ? target : value + 1);
    const dec = () => !isDisabled && onChange(Math.max(0, value - 1));
    const lpPlus = useLongPress(inc);
    const lpMinus = useLongPress(dec);

    return (
      <div className={`bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3 flex items-center justify-between border border-slate-300 min-h-[84px] transition-opacity duration-300 ${isDisabled ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
        <div className="flex-1 pr-4">
          <h4 className="font-semibold text-slate-800 text-sm mb-1.5">{label}</h4>
          {target !== null && (
            <div className={`inline-flex items-center ${t.primaryBg} text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm`}>
              Target: {onTargetChange ? (<input type="number" min="0" value={target} disabled={isDisabled} onChange={(e) => onTargetChange(Math.max(0, parseInt(e.target.value) || 0))} className="w-8 text-center bg-black/20 rounded text-white font-bold outline-none ml-1" />) : (<span className="ml-1">{target}</span>)} <span className="ml-1">{unit}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-300">
          <button onClick={dec} {...(!isDisabled ? lpMinus : {})} disabled={isDisabled} className="w-11 h-11 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-rose-700 active:scale-95 transition-all border border-slate-300 touch-manipulation disabled:opacity-50"><Minus size={20}/></button>
          <div className="w-12"><input type="number" min="0" value={value} disabled={isDisabled} onChange={(e) => { const v = Math.max(0, parseInt(e.target.value)||0); onChange(!noTargetLimit && v > target ? target : v); }} className="w-full text-center bg-transparent font-bold text-xl text-slate-900 outline-none p-0 disabled:text-slate-500" /></div>
          <button onClick={inc} {...(!isDisabled ? lpPlus : {})} disabled={isDisabled || (!noTargetLimit && value >= target)} className={`w-11 h-11 flex items-center justify-center rounded-lg shadow-sm transition-all border touch-manipulation ${isDisabled || (!noTargetLimit && value >= target) ? 'bg-slate-300 text-slate-400 cursor-not-allowed' : `${t.primaryBg} text-white hover:opacity-90 active:scale-95`}`}><Plus size={20}/></button>
        </div>
      </div>
    );
};

const FileInput = ({ label, existingUrl, onFileSelect, isDisabled = false, t }: any) => {
    const [fileName, setFileName] = useState("");
    const handleFile = (e: any) => {
       if(e.target.files && e.target.files[0]) {
           setFileName(e.target.files[0].name);
           onFileSelect(e.target.files[0]);
       }
    };
    return (
      <div className={`bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3 border border-slate-300 transition-opacity duration-300 ${isDisabled ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
          <div className="mb-2"><h4 className="font-semibold text-slate-800 text-sm">{label} <span className="text-rose-600">*</span></h4></div>
          {existingUrl && typeof existingUrl === 'string' && existingUrl.includes('http') ? (
              <div className={`flex items-center gap-3 p-3 ${t.primaryLightBg} border border-opacity-30 rounded-xl mb-2`}>
                  <div className={`w-10 h-10 bg-white rounded-full flex items-center justify-center ${t.primaryText}`}><LinkIcon size={20}/></div>
                  <div className="flex-1 overflow-hidden"><p className={`text-xs font-bold ${t.primaryText}`}>File Sudah Terupload</p><a href={existingUrl} target="_blank" rel="noopener noreferrer" className={`text-[10px] ${t.primaryText} underline truncate block w-full`}>Buka Link File</a></div>
                  <div className="bg-white p-1 rounded-full"><CheckCircle size={16} className={t.primaryText}/></div>
              </div>
          ) : (
              <div className="relative">
                  <input type="file" disabled={isDisabled} onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-dashed border-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-300"><UploadCloud size={20}/></div>
                      <div className="flex-1"><p className="text-xs font-bold text-slate-700">{fileName || "Tap untuk pilih file (Wajib)"}</p><p className="text-[10px] text-slate-500">{fileName ? "Siap diupload" : "PDF/Doc/Image"}</p></div>
                  </div>
              </div>
          )}
      </div>
   );
};

const PuasaToggle = ({ label, checked, onChange, target, onTargetChange, isDisabled = false, t }: any) => {
    const isCheckDisabled = isDisabled || target === 0;
    return (
      <div className={`bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3 flex items-center justify-between border border-slate-300 min-h-[84px] transition-opacity duration-300 ${isDisabled ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
        <div className="flex-1 pr-4"><h4 className="font-semibold text-slate-800 text-sm">{label}</h4></div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <span className="uppercase tracking-wide text-[10px]">Target:</span>
              <div className="flex items-center bg-slate-100 rounded-lg border border-slate-300">
                  <button onClick={() => onTargetChange(Math.max(0, target - 1))} disabled={isDisabled || target <= 0} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-rose-700 disabled:opacity-30"><Minus size={12} /></button>
                  <div className="w-5 text-center text-slate-800">{target}</div>
                  <button onClick={() => onTargetChange(Math.min(1, target + 1))} disabled={isDisabled || target >= 1} className={`w-6 h-6 flex items-center justify-center text-slate-600 hover:opacity-80 disabled:opacity-30`}><Plus size={12} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-300">
               <button onClick={() => onChange(false)} disabled={isDisabled} className={`w-10 h-9 flex items-center justify-center rounded-lg transition-all touch-manipulation ${!checked ? 'bg-white shadow text-rose-600 border border-rose-200' : 'text-slate-400 hover:text-rose-500'}`}><X size={18} strokeWidth={3} /></button>
               <button onClick={() => onChange(true)} disabled={isCheckDisabled} className={`w-10 h-9 flex items-center justify-center rounded-lg transition-all touch-manipulation ${checked ? \`bg-white shadow ${t.primaryText} border border-opacity-30\` : 'text-slate-400 hover:opacity-80'} ${isCheckDisabled ? 'cursor-not-allowed opacity-50 bg-slate-100 !text-slate-300 !border-transparent' : ''}`}><Check size={18} strokeWidth={3} /></button>
            </div>
        </div>
      </div>
    );
  };
  const SectionHeader = ({ title }: any) => <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-6 mb-3 px-1">{title}</h3>;

const LandingPage = ({ onSelectMode, t, onBack }: any) => (
  <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center px-6 animate-slide-up relative">
    <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-100 transition-colors">
      <ArrowLeft size={20} />
    </button>
    <div className="mb-10 text-center">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">YAUMIYAH GURU</h1>
      <p className={`${t.primaryText} font-bold uppercase tracking-widest text-xs`}>MIS IT Al Uswah</p>
    </div>
    <div className="w-full max-w-sm space-y-4">
      <button onClick={() => onSelectMode(PIN_GURU ? 'guru-login' : 'guru')} className={`w-full ${t.primaryLightBg} p-6 rounded-3xl shadow-sm border border-opacity-30 flex items-center gap-4 hover:shadow-md transition-all active:scale-95 group`}>
        <div className={`w-14 h-14 bg-white ${t.primaryText} rounded-2xl flex items-center justify-center group-hover:${t.primaryBg} group-hover:text-white transition-colors`}><User size={28}/></div>
        <div className="text-left"><h2 className="text-lg font-bold text-slate-900">Guru</h2><p className="text-slate-500 text-xs">Isi Laporan Harian</p></div>
        <ChevronDown className="ml-auto text-slate-400 -rotate-90"/>
      </button>
      <button onClick={() => onSelectMode('admin-login')} className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-300 flex items-center gap-4 hover:shadow-md transition-all active:scale-95 group">
        <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors"><Shield size={28}/></div>
        <div className="text-left"><h2 className="text-lg font-bold text-slate-900">Monitor</h2><p className="text-slate-600 text-xs">Admin & Pengawas</p></div>
        <ChevronDown className="ml-auto text-slate-400 -rotate-90"/>
      </button>
    </div>
  </div>
);

const GuruLogin = ({ onLoginSuccess, onBack, t }: any) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (pin === PIN_GURU || PIN_GURU === "") {
      onLoginSuccess();
    } else {
      setError("PIN Salah!");
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center px-6 animate-slide-up relative">
      <button onClick={onBack} className="absolute top-6 left-6 bg-white p-2 rounded-full shadow-sm border border-slate-300 text-slate-600 hover:text-slate-900 transition-all active:scale-95"><ArrowLeft size={20}/></button>
      <div className="text-center mb-8">
        <div className={`w-16 h-16 ${t.primaryBg} text-white rounded-2xl flex items-center justify-center mx-auto mb-4`}><Lock size={32}/></div>
        <h2 className="text-2xl font-bold text-slate-900">Akses Guru</h2>
        <p className="text-slate-600 text-sm">Masukkan PIN untuk mengakses form</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN..." className={`w-full p-4 bg-white border border-slate-300 rounded-2xl text-center font-bold text-lg text-slate-900 outline-none focus:ring-2 focus:ring-${t.primaryColor} transition-all`} autoFocus />
        <button className={`w-full p-4 ${t.primaryBg} text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all`}>Lanjut</button>
        {error && <p className="text-center text-rose-600 font-bold text-sm animate-pulse">{error}</p>}
      </form>
    </div>
  );
};

const AdminLogin = ({ onLogin, onBack, t }: any) => {
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(YAUMIYAH_GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'checkAdminPassword', password: pass })
      });
      const result = await res.json();
      if (result.success) {
        onLogin();
      } else {
        setError("Password Salah!");
      }
    } catch (err) {
      setError("Error koneksi");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center px-6 animate-slide-up relative">
      <button onClick={onBack} className="absolute top-6 left-6 bg-white p-2 rounded-full shadow-sm border border-slate-300 text-slate-600 hover:text-slate-900 transition-all active:scale-95"><ArrowLeft size={20}/></button>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-slate-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield size={32}/></div>
        <h2 className="text-2xl font-bold text-slate-900">Login Monitor</h2>
        <p className="text-slate-600 text-sm">Masukkan password admin</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password..." className="w-full p-4 bg-white border border-slate-300 rounded-2xl text-center font-bold text-lg text-slate-900 outline-none focus:ring-2 focus:ring-slate-800 transition-all" autoFocus />
        <button disabled={loading} className="w-full p-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
          {loading ? <span className="flex items-center gap-2"><Loader2 className="animate-spin"/> Memuat Data...</span> : 'Masuk Dashboard'}
        </button>
        {error && <p className="text-center text-rose-600 font-bold text-sm animate-pulse">{error}</p>}
      </form>
    </div>
  );
};
"""

content2 = """
const RekapAllPage = ({ data, guruList, onBack, t }: any) => {
   const [activeTab, setActiveTab] = useState('bulan'); 
   const [filterBulan, setFilterBulan] = useState(CURRENT_MONTH_NAME);
   const [filterSemester, setFilterSemester] = useState('1'); 
   const [isExporting, setIsExporting] = useState(false);

   const getSemester = (bulan: string) => {
       const norm = normalize(bulan);
       const mIdx = MONTH_NAMES.findIndex(m => normalize(m) === norm);
       if (mIdx >= 6) return '1';
       return '2';
   };

   const { categoryStats, topPerformers, bottomPerformers, overallAverage, teacherScores } = useMemo(() => {
      const totals: any = {}; const teacherStats: any = {};
      const allItems = [...CATEGORIES.ibadah.items, ...CATEGORIES.profesional.items, ...CATEGORIES.sosial.items];
      
      allItems.forEach(key => { totals[key] = { cap: 0, tar: 0 }; });

      if (guruList && guruList.length > 0) {
          guruList.forEach((g: any) => {
              teacherStats[g.nama] = { totalPct: 0, count: 0, items: {} };
              allItems.forEach(k => teacherStats[g.nama].items[k] = { pctSum: 0 });
          });
      }

      const dedupedData: any[] = [];
      const teacherMonthPekanMap = new Map();
      
      data.forEach((d: any) => {
          const key = `${d._normNama}-${d._normBulan}-${d._normPekan}`;
          teacherMonthPekanMap.set(key, d); 
      });
      teacherMonthPekanMap.forEach(v => dedupedData.push(v));

      const filteredData = dedupedData.filter(d => {
          if (activeTab === 'bulan') {
              return d._normBulan === normalize(filterBulan);
          } else {
              const sem = getSemester(d.bulan);
              return sem === filterSemester;
          }
      });

      const activeWeeksSet = new Set(filteredData.map(d => d._normBulan + '-' + d._normPekan));
      const expectedWeeksCount = activeWeeksSet.size;

      let globalTotalCap = 0;
      let globalTotalTar = 0;

      filteredData.forEach(d => {
          const map = d.mapped || {};
          const name = d.nama;
          
          if(!teacherStats[name]) {
              teacherStats[name] = { totalPct: 0, count: 0, items: {} };
              allItems.forEach(k => teacherStats[name].items[k] = { pctSum: 0 });
          }
          
          let teacherDailyScore = 0;
          let teacherItemCount = 0;

          allItems.forEach(key => {
              let targetKey = 'target' + key.charAt(0).toUpperCase() + key.slice(1);
              if(key === 'menyapaSiswa') targetKey = 'targetMenyapa';
              const cap = map[key] || 0; const tar = map[targetKey] || 0;
              
              totals[key].cap += cap;
              totals[key].tar += tar;

              let itemPct = 0;
              if (tar > 0) {
                  const validCap = Math.min(cap, tar);
                  itemPct = validCap / tar;
                  
                  globalTotalCap += validCap;
                  globalTotalTar += tar;
                  
                  teacherDailyScore += itemPct;
                  teacherItemCount++;
              } else if (cap > 0 && tar === 0) {
                  itemPct = 1;
                  teacherDailyScore += 1;
                  teacherItemCount++;
              }

              teacherStats[name].items[key].pctSum += itemPct;
          });
          
          if (teacherItemCount > 0) {
              teacherStats[name].totalPct += (teacherDailyScore / teacherItemCount);
              teacherStats[name].count++;
          }
      });

      const rankList = Object.keys(teacherStats).map((name) => {
          const s = teacherStats[name];
          const finalScore = expectedWeeksCount > 0 ? Math.round((s.totalPct / expectedWeeksCount) * 100) : 0;
          
          const detailedScores: any = {};
          Object.keys(s.items).forEach(k => {
              const iPctSum = s.items[k].pctSum;
              detailedScores[k] = expectedWeeksCount > 0 ? Math.round((iPctSum / expectedWeeksCount) * 100) : 0;
          });

          return { name, score: finalScore, details: detailedScores };
      });

      const sortedRank = [...rankList].sort((a,b) => b.score - a.score);
      const top = sortedRank.slice(0, 3);
      const bottom = sortedRank.length > 3 ? sortedRank.slice(-3).reverse() : [];
      const overallAvg = globalTotalTar > 0 ? Math.round((globalTotalCap / globalTotalTar) * 100) : 0;

      return { categoryStats: Object.keys(CATEGORIES).map(catKey => {
          const items = (CATEGORIES as any)[catKey].items;
          const itemStats = items.map((key: string) => {
              const totalCap = totals[key].cap;
              const totalTar = totals[key].tar;
              const globalPct = totalTar > 0 ? Math.round((totalCap / totalTar) * 100) : (totalCap > 0 ? 100 : 0);
              return { label: ITEM_LABELS[key], pct: globalPct, cap: totalCap, tar: totalTar };
          });
          return { title: (CATEGORIES as any)[catKey].label, items: itemStats };
      }), topPerformers: top, bottomPerformers: bottom, overallAverage: overallAvg, teacherScores: sortedRank };
   }, [data, activeTab, filterBulan, filterSemester, guruList]);

   const handleExport = () => {
       setIsExporting(true);
       setTimeout(() => {
           try {
               const allItems = [...CATEGORIES.ibadah.items, ...CATEGORIES.profesional.items, ...CATEGORIES.sosial.items];
               const headers = ["No", "Nama Guru", "Bulan", ...allItems.map(k => ITEM_LABELS[k]), "Rata-rata Total"];
               
               const calculateRows = (subsetData: any[], monthLabel: string) => {
                   const activeWeeksSet = new Set(subsetData.map(d => d._normBulan + '-' + d._normPekan));
                   const expectedWeeksCount = activeWeeksSet.size;

                   const tStats: any = {};
                   
                   if (guruList && guruList.length > 0) {
                       guruList.forEach((g: any) => {
                           tStats[g.nama] = { count: 0, totalPct: 0, items: {} };
                           allItems.forEach(k => tStats[g.nama].items[k] = { pctSum: 0 });
                       });
                   }

                   subsetData.forEach(d => {
                       const name = d.nama;
                       if(!tStats[name]) {
                           tStats[name] = { count: 0, totalPct: 0, items: {} };
                           allItems.forEach(k => tStats[name].items[k] = { pctSum: 0 });
                       }
                       const map = d.mapped || {};
                       let dailyScore = 0; let dailyCount = 0;

                       allItems.forEach(key => {
                          let targetKey = 'target' + key.charAt(0).toUpperCase() + key.slice(1);
                          if(key === 'menyapaSiswa') targetKey = 'targetMenyapa';
                          const cap = map[key] || 0; const tar = map[targetKey] || 0;
                          
                          let itemPct = 0;
                          if(tar > 0) {
                              itemPct = Math.min(cap, tar)/tar;
                              dailyScore += itemPct;
                              dailyCount++;
                          } else if(cap > 0) {
                              itemPct = 1;
                              dailyScore += 1;
                              dailyCount++;
                          }
                          
                          tStats[name].items[key].pctSum += itemPct;
                       });
                       if(dailyCount>0) {
                           tStats[name].totalPct += (dailyScore/dailyCount);
                           tStats[name].count++;
                       }
                   });
                   
                   return Object.keys(tStats).map((name, i) => {
                       const s = tStats[name];
                       const row: any = { "No": i + 1, "Nama Guru": name, "Bulan": monthLabel };
                       allItems.forEach(k => {
                           const iPctSum = s.items[k].pctSum;
                           const pct = expectedWeeksCount > 0 ? Math.round((iPctSum / expectedWeeksCount) * 100) : 0;
                           row[ITEM_LABELS[k]] = pct + "%";
                       });
                       const final = expectedWeeksCount > 0 ? Math.round((s.totalPct / expectedWeeksCount) * 100) : 0;
                       row["Rata-rata Total"] = final + "%";
                       return row;
                   });
               };

               const wb = XLSX.utils.book_new();

               if (activeTab === 'bulan') {
                   const deduped: any[] = [];
                   const map = new Map();
                   data.filter((d: any) => d._normBulan === normalize(filterBulan)).forEach((d: any) => {
                       map.set(`${d._normNama}-${d._normPekan}`, d);
                   });
                   map.forEach(v => deduped.push(v));

                   const rows = calculateRows(deduped, filterBulan);
                   const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
                   XLSX.utils.book_append_sheet(wb, ws, filterBulan);
                   XLSX.writeFile(wb, `Rekap_Yaumiyah_${filterBulan}.xlsx`);

               } else {
                   const semMonths = MONTH_NAMES.filter(m => getSemester(m) === filterSemester);
                   semMonths.forEach(m => {
                       const deduped: any[] = [];
                       const map = new Map();
                       data.filter((d: any) => d._normBulan === normalize(m)).forEach((d: any) => {
                           map.set(`${d._normNama}-${d._normPekan}`, d);
                       });
                       map.forEach(v => deduped.push(v));

                       if(deduped.length > 0) {
                           const rows = calculateRows(deduped, m);
                           const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
                           XLSX.utils.book_append_sheet(wb, ws, m);
                       }
                   });
                   if(wb.SheetNames.length === 0) {
                       alert("Tidak ada data untuk semester ini.");
                   } else {
                       XLSX.writeFile(wb, `Rekap_Semester_${filterSemester}.xlsx`);
                   }
               }

           } catch (e: any) {
               alert("Gagal Export: " + e.message);
           } finally {
               setIsExporting(false);
           }
       }, 500);
   };

   return (
      <div className="min-h-screen bg-[#F1F5F9] pb-24 animate-slide-up relative">
          <div className="sticky top-0 z-30 bg-slate-900 text-white shadow-lg rounded-b-3xl">
              <div className="px-5 py-4 flex items-center justify-between">
                  <button onClick={onBack} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all text-white shadow-lg"><ArrowLeft size={18}/></button>
                  <h1 className="text-lg font-bold">Rekapitulasi Total</h1>
                  <div className="w-8"></div>
              </div>
              <div className="px-5 pb-4">
                  <div className="flex bg-slate-800/50 p-1 rounded-xl mb-3">
                      <button onClick={()=>setActiveTab('bulan')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab==='bulan'?'bg-white text-slate-900 shadow':'text-slate-400 hover:text-white'}`}>Per Bulan</button>
                      <button onClick={()=>setActiveTab('semester')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab==='semester'?'bg-white text-slate-900 shadow':'text-slate-400 hover:text-white'}`}>Per Semester</button>
                  </div>
                  
                  <div className="flex gap-3 items-stretch">
                      <div className="flex-1 relative">
                          {activeTab === 'bulan' ? (
                              <div className="relative h-full">
                                  <select value={filterBulan} onChange={(e)=>setFilterBulan(e.target.value)} className="w-full h-full p-2 pl-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white outline-none appearance-none">
                                      {MONTH_NAMES.map(m=><option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                              </div>
                          ) : (
                              <div className="relative h-full">
                                  <select value={filterSemester} onChange={(e)=>setFilterSemester(e.target.value)} className="w-full h-full p-2 pl-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white outline-none appearance-none">
                                      <option value="1">Semester 1 (Ganjil)</option>
                                      <option value="2">Semester 2 (Genap)</option>
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                              </div>
                          )}
                      </div>
                      
                      <div className={`bg-gradient-to-br ${t.primaryBg.replace('bg-', 'from-')} to-slate-800 rounded-xl p-2 px-4 flex flex-col items-center justify-center min-w-[80px] shadow-lg border border-white/10`}>
                          <span className="text-[10px] text-teal-100 font-bold uppercase tracking-wider">Rata-rata</span>
                          <span className="text-xl font-black text-white">{overallAverage}%</span>
                      </div>
                  </div>

                  <button onClick={handleExport} disabled={isExporting} className={`w-full mt-3 ${t.primaryBg} hover:opacity-90 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}>
                      {isExporting ? <Loader2 className="animate-spin" size={18}/> : <FileSpreadsheet size={18}/>}
                      {isExporting ? 'Memproses Excel...' : (activeTab==='bulan' ? `Ekspor ${filterBulan}` : 'Ekspor Semester')}
                  </button>
              </div>
          </div>
          
          <div className="px-5 mt-6 space-y-6">
              {topPerformers.length > 0 && (
                   <div className={`bg-gradient-to-br ${t.primaryBg.replace('bg-', 'from-')} to-slate-800 rounded-3xl p-5 shadow-lg text-white relative overflow-hidden`}>
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={100}/></div>
                       <h3 className="font-bold text-teal-100 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Trophy size={14}/> Top 3 Terbaik</h3>
                       <div className="space-y-3 relative z-10">
                           {topPerformers.map((tp, i) => (
                               <div key={i} className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-800 ${i===0?'bg-amber-400':i===1?'bg-slate-300':'bg-orange-300'}`}>{i+1}</div>
                                   <span className="font-bold text-sm flex-1 truncate">{tp.name}</span>
                                   <span className="font-mono font-bold">{tp.score}%</span>
                               </div>
                           ))}
                       </div>
                   </div>
              )}

              {bottomPerformers.length > 0 && (
                   <div className="bg-gradient-to-br from-orange-500 to-red-700 rounded-3xl p-5 shadow-lg text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown size={100}/></div>
                       <h3 className="font-bold text-orange-100 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><TrendingDown size={14}/> Perlu Perhatian</h3>
                       <div className="space-y-3 relative z-10">
                           {bottomPerformers.map((tp, i) => (
                               <div key={i} className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                                   <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-white/20">{teacherScores.length - i}</div>
                                   <span className="font-bold text-sm flex-1 truncate">{tp.name}</span>
                                   <span className="font-mono font-bold">{tp.score}%</span>
                               </div>
                           ))}
                       </div>
                   </div>
              )}

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center gap-2"><User size={16} /> Detail Capaian Guru</h3>
                  <div className="space-y-3">
                      {teacherScores.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-xs italic">Tidak ada data untuk periode ini</div>
                      ) : (
                          teacherScores.map((tp, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tp.score >= 80 ? 'bg-teal-100 text-teal-700' : tp.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{i+1}</div>
                                      <div className="truncate">
                                          <p className="font-bold text-sm text-slate-800 truncate">{tp.name}</p>
                                          <p className="text-[10px] text-slate-500">{tp.score >= 80 ? 'Sangat Baik' : tp.score >= 60 ? 'Baik' : 'Cukup'}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                       <div className={`text-lg font-black ${tp.score >= 80 ? 'text-teal-700' : tp.score >= 60 ? 'text-amber-600' : 'text-rose-700'}`}>{tp.score}%</div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
              {categoryStats.map((cat, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">{cat.title}</h3>
                      <div className="space-y-2">
                          {cat.items.map((item: any, i: number) => (
                              <StatItem key={i} label={item.label} pct={item.pct} cap={item.cap} tar={item.tar} t={t} /> 
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
   );
};

const Dashboard = ({ guruList, onBack, onGoToRekap, data, onSelectTeacher, onRefresh, isRefreshing, t }: any) => {
  const [filterBulan, setFilterBulan] = useState(CURRENT_MONTH_NAME);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [waApiUrl, setWaApiUrl] = useState(localStorage.getItem('waApiUrl') || '');
  const [waApiKey, setWaApiKey] = useState(localStorage.getItem('waApiKey') || '');
  const [isSendingWa, setIsSendingWa] = useState(false);

  const getWeeksInMonth = (m: string) => { const mIdx = MONTH_NAMES.indexOf(m); const d = new Date(new Date().getFullYear(), mIdx + 1, 0).getDate(); return d > 28 ? 5 : 4; };
  const maxWeeks = getWeeksInMonth(filterBulan);
  
  const sortedGuruList = useMemo(() => {
      let list = [...guruList];
      if (searchTerm) { list = list.filter(g => g.nama.toLowerCase().includes(searchTerm.toLowerCase())); }
      const normFilterBulan = normalize(filterBulan);
      return list.sort((a, b) => {
          const normANama = normalize(a.nama); const normBNama = normalize(b.nama);
          const countA = data.filter((d: any) => (d._normNama.includes(normANama) || normANama.includes(d._normNama)) && d._normBulan.includes(normFilterBulan)).length;
          const countB = data.filter((d: any) => (d._normNama.includes(normBNama) || normBNama.includes(d._normNama)) && d._normBulan.includes(normFilterBulan)).length;
          return countA - countB; 
      });
  }, [guruList, data, filterBulan, searchTerm]);

  const getMissingWeeks = (nama: string) => {
      const normNama = normalize(nama); const normBulan = normalize(filterBulan);
      const relevantData = data.filter((d: any) => (d._normNama.includes(normNama) || normNama.includes(d._normNama)) && d._normBulan.includes(normBulan));
      const filledSet = new Set(relevantData.map((d: any) => String(d._normPekan)));
      const missing = [];
      for (let i = 1; i <= maxWeeks; i++) {
          if (!filledSet.has(String(i))) missing.push(i);
      }
      return missing;
  };

  const saveWaSettings = () => {
      localStorage.setItem('waApiUrl', waApiUrl);
      localStorage.setItem('waApiKey', waApiKey);
      setShowWaSettings(false);
      alert("Pengaturan WA disimpan!");
  };

  const handleSendWA = async () => {
      if (!waApiUrl) {
          alert("Harap isi Endpoint URL API WA di Pengaturan terlebih dahulu.");
          setShowWaSettings(true);
          return;
      }
      
      const konfirmasi = window.confirm(`Kirim pesan WA ke semua guru yang belum mengisi penuh bulan ${filterBulan}?`);
      if(!konfirmasi) return;

      setIsSendingWa(true);
      let success = 0; let failed = 0;

      for (const g of guruList) {
          const missing = getMissingWeeks(g.nama);
          if (missing.length > 0 && g.phone) {
              const msg = `Assalamu'alaikum Ustadz/ah ${g.nama},\\n\\nMohon kerjasamanya untuk melengkapi Laporan Yaumiyah bulan *${filterBulan}*.\\n\\nPekan yang belum diisi: *Pekan ${missing.join(', ')}*.\\n\\nJazakumullah khairan katsiran.`;
              
              try {
                  await fetch(waApiUrl, {
                      method: 'POST',
                      headers: { 'Authorization': waApiKey, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ target: g.phone, message: msg })
                  });
                  success++;
              } catch (e) {
                  failed++;
              }
          } else if (missing.length > 0 && !g.phone) {
              failed++; 
          }
      }
      setIsSendingWa(false);
      alert(`Selesai!\\nBerhasil terkirim: ${success}\\nGagal (API/No WA kosong): ${failed}`);
  };

  return (
    <div className="fixed inset-0 bg-[#F1F5F9] flex flex-col items-center justify-center px-6 animate-slide-up">
      
      {showWaSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Pengaturan API WhatsApp</h3>
                  <p className="text-xs text-slate-500 mb-4">Gunakan API Gateway (contoh: Fonnte) untuk mengirim pesan otomatis.</p>
                  <div className="space-y-3 mb-4">
                      <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Endpoint URL API</label>
                          <input type="text" value={waApiUrl} onChange={e=>setWaApiUrl(e.target.value)} placeholder="https://api.fonnte.com/send" className="w-full p-3 border rounded-xl text-sm bg-slate-50"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">API Key / Token</label>
                          <input type="password" value={waApiKey} onChange={e=>setWaApiKey(e.target.value)} placeholder="Token..." className="w-full p-3 border rounded-xl text-sm bg-slate-50"/>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={()=>setShowWaSettings(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Batal</button>
                      <button onClick={saveWaSettings} className={`flex-1 p-3 ${t.primaryBg} text-white rounded-xl font-bold`}>Simpan</button>
                  </div>
              </div>
          </div>
      )}

      <div className="w-full max-w-md bg-slate-900 text-white shadow-lg rounded-b-3xl shrink-0 z-20">
          <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                      <button onClick={onBack} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all text-white shadow-lg"><ArrowLeft size={18}/></button>
                      <button onClick={onRefresh} disabled={isRefreshing} className={`${t.primaryBg} p-2 rounded-full hover:opacity-90 transition-all text-white shadow-lg ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}>{isRefreshing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18}/>}</button>
                  </div>
                  <h1 className="text-lg font-bold">Monitor Guru</h1>
                  <div className="flex gap-2">
                      <button onClick={()=>setShowWaSettings(true)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all text-white" title="Pengaturan WA"><Settings size={18}/></button>
                      <button onClick={() => onGoToRekap(data)} className={`${t.primaryLightBg} p-2 rounded-full hover:${t.primaryBg} transition-all ${t.primaryText} border border-opacity-30`} title="Rekap Semua"><BarChart2 size={18}/></button>
                  </div>
              </div>
              <div className="relative mb-2">
                  <select value={filterBulan} onChange={(e)=>setFilterBulan(e.target.value)} className="w-full p-2.5 pl-4 pr-10 bg-slate-800 border border-slate-700 rounded-xl font-medium text-white outline-none appearance-none text-sm cursor-pointer hover:bg-slate-700 transition-colors">{MONTH_NAMES.map(m=><option key={m} value={m}>{m}</option>)}</select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16}/>
              </div>
              <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                      <input type="text" placeholder="Cari guru..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2.5 pl-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white outline-none text-sm placeholder:text-slate-500 focus:bg-slate-800 transition-colors" />
                      <div className="absolute left-3 top-2.5 text-slate-500"><Search size={16} /></div>
                      {searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white"><X size={16} /></button>)}
                  </div>
                  <button onClick={handleSendWA} disabled={isSendingWa} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-xl shadow transition-all flex items-center justify-center gap-1 disabled:opacity-50">
                      {isSendingWa ? <Loader2 size={16} className="animate-spin"/> : <MessageCircle size={16}/>}
                  </button>
              </div>
          </div>
      </div>
      <div className="w-full max-w-md flex-1 min-h-0 relative">
           <div className="absolute inset-0 overflow-y-auto px-1 pt-6 pb-20 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3 pb-10">
                  {sortedGuruList.length === 0 ? (<div className="text-center py-10 text-slate-500 italic">Guru tidak ditemukan.</div>) : (
                      sortedGuruList.map(g => {
                      const missingWeeks = getMissingWeeks(g.nama);
                      const filled = maxWeeks - missingWeeks.length;
                      const isComplete = filled >= maxWeeks;
                      const isEmpty = filled === 0;
                      const isPartial = filled > 0 && filled < maxWeeks;
                      return (
                          <div key={g.id} onClick={() => onSelectTeacher(g.nama)} className={`group bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between hover:shadow-md ${isEmpty ? 'border-rose-200 hover:border-rose-400' : isComplete ? 'border-teal-200 hover:border-teal-400' : isPartial ? 'border-amber-200 hover:border-amber-400' : 'border-slate-200 hover:border-slate-400'}`}>
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isEmpty ? 'bg-rose-100 text-rose-700' : isComplete ? 'bg-teal-100 text-teal-700' : isPartial ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}><Folder size={20} fill="currentColor" className="opacity-80"/></div>
                                  <div>
                                      <h4 className="font-bold text-slate-900 text-sm">{g.nama}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                          <div className="flex gap-0.5">{Array.from({length: maxWeeks}).map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full ${i < filled ? (isComplete ? 'bg-teal-500' : isPartial ? 'bg-amber-500' : 'bg-slate-400') : 'bg-slate-300'}`}></div>))}</div>
                                          <span className={`text-[10px] font-bold ${isEmpty ? 'text-rose-700' : isComplete ? 'text-teal-700' : isPartial ? 'text-amber-700' : 'text-slate-500'}`}>{filled}/{maxWeeks} Pekan</span>
                                      </div>
                                      {!isComplete && (
                                          <div className="text-[10px] text-rose-500 mt-1 font-medium bg-rose-50 px-1.5 py-0.5 rounded inline-block">Belum isi pekan: {missingWeeks.join(', ')}</div>
                                      )}
                                  </div>
                              </div>
                              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors"/>
                          </div>
                      );
                      })
                  )}
                  <div className="text-[10px] text-center text-slate-500 mt-4">Total Data Terunduh: {data.length} baris</div>
               </div>
           </div>
      </div>
    </div>
  );
};
"""
content3 = """
const DetailGuru = ({ nama, data, onBack, t }: any) => {
   const [filterBulan, setFilterBulan] = useState(CURRENT_MONTH_NAME);
   const [filterPekan, setFilterPekan] = useState('1');
   
   const normNama = normalize(nama);
   const normBulan = normalize(filterBulan);
   const normPekan = normalizePekan(filterPekan);

   const currentData = useMemo(() => {
      return data.find((d: any) => d._normNama === normNama && d._normBulan === normBulan && d._normPekan === normPekan);
   }, [data, normNama, normBulan, normPekan]);

   const { totalScore, categoryScores } = useMemo(() => {
      if (!currentData) return { totalScore: 0, categoryScores: [] };
      const map = currentData.mapped || {};
      let dailyScore = 0; let dailyCount = 0;
      
      const catScores = Object.keys(CATEGORIES).map(catKey => {
          const items = (CATEGORIES as any)[catKey].items;
          let catScore = 0; let catCount = 0;
          
          items.forEach((key: string) => {
              let targetKey = 'target' + key.charAt(0).toUpperCase() + key.slice(1);
              if(key === 'menyapaSiswa') targetKey = 'targetMenyapa';
              const cap = map[key] || 0; const tar = map[targetKey] || 0;
              
              if(tar > 0) {
                  const itemPct = Math.min(cap, tar)/tar;
                  catScore += itemPct; catCount++;
                  dailyScore += itemPct; dailyCount++;
              } else if (cap > 0) {
                  catScore += 1; catCount++;
                  dailyScore += 1; dailyCount++;
              }
          });
          return { title: (CATEGORIES as any)[catKey].label, score: catCount > 0 ? Math.round((catScore/catCount)*100) : 0 };
      });
      return { totalScore: dailyCount > 0 ? Math.round((dailyScore/dailyCount)*100) : 0, categoryScores: catScores };
   }, [currentData]);

   return (
      <div className="min-h-screen bg-[#F1F5F9] pb-24 animate-slide-up relative">
          <div className="sticky top-0 z-30 bg-slate-900 text-white shadow-lg rounded-b-3xl">
              <div className="px-5 py-4 flex items-center justify-between">
                  <button onClick={onBack} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all text-white shadow-lg"><ArrowLeft size={18}/></button>
                  <h1 className="text-lg font-bold">Detail Guru</h1>
                  <div className="w-8"></div>
              </div>
              <div className="px-5 pb-6 text-center">
                  <div className={`w-20 h-20 ${t.primaryBg} rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border-4 border-slate-800`}><User size={36} className="text-white"/></div>
                  <h2 className="text-xl font-bold text-white">{nama}</h2>
                  <p className="text-slate-400 text-sm">Laporan Yaumiyah</p>
              </div>
          </div>
          
          <div className="px-5 -mt-6 relative z-40">
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-200 flex gap-3">
                  <div className="flex-1 relative">
                      <select value={filterBulan} onChange={(e)=>setFilterBulan(e.target.value)} className="w-full p-3 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none text-sm focus:ring-2 focus:ring-slate-200 transition-all">{MONTH_NAMES.map(m=><option key={m} value={m}>{m}</option>)}</select>
                      <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                  </div>
                  <div className="w-1/3 relative">
                      <select value={filterPekan} onChange={(e)=>setFilterPekan(e.target.value)} className="w-full p-3 pl-4 pr-8 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none text-sm focus:ring-2 focus:ring-slate-200 transition-all">
                          {[1,2,3,4,5].map(p=><option key={p} value={p}>P{p}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                  </div>
              </div>
          </div>

          <div className="px-5 mt-6 space-y-6">
              {!currentData ? (
                  <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Folder size={28} className="text-slate-400"/></div>
                      <h3 className="font-bold text-slate-800 mb-1">Belum Ada Data</h3>
                      <p className="text-sm text-slate-500">Guru belum mengisi laporan pada pekan ini.</p>
                  </div>
              ) : (
                  <>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                          <div className="flex justify-between items-center mb-6">
                              <div><h3 className="font-bold text-slate-800 text-lg">Skor Pekan Ini</h3><p className="text-xs text-slate-500">Rata-rata capaian target</p></div>
                              <ScoreCircle score={totalScore} size="lg" t={t} />
                          </div>
                          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100">
                              {categoryScores.map((c: any, i: number) => (
                                  <div key={i} className="text-center">
                                      <div className={`text-lg font-black mb-1 ${c.score >= 80 ? t.primaryText : c.score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{c.score}%</div>
                                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{c.title.split(' ')[0]}</div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {Object.keys(CATEGORIES).map((catKey, idx) => {
                          const items = (CATEGORIES as any)[catKey].items;
                          const map = currentData.mapped || {};
                          return (
                              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                  <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">{(CATEGORIES as any)[catKey].label}</h3>
                                  <div className="space-y-3">
                                      {items.map((key: string, i: number) => {
                                          let targetKey = 'target' + key.charAt(0).toUpperCase() + key.slice(1);
                                          if(key === 'menyapaSiswa') targetKey = 'targetMenyapa';
                                          const cap = map[key] || 0; const tar = map[targetKey] || 0;
                                          const pct = tar > 0 ? Math.round((Math.min(cap, tar)/tar)*100) : (cap > 0 ? 100 : 0);
                                          
                                          if (key === 'perangkat') {
                                              const rawLink = currentData.raw ? currentData.raw[17] : null;
                                              const isLink = typeof rawLink === 'string' && rawLink.includes('http');
                                              return (
                                                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                      <span className="text-sm font-semibold text-slate-700">{ITEM_LABELS[key]}</span>
                                                      {isLink ? (
                                                          <a href={rawLink} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs font-bold ${t.primaryText} bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200`}><LinkIcon size={12}/> Lihat File</a>
                                                      ) : (
                                                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${cap ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>{cap ? 'Sudah' : 'Belum'}</span>
                                                      )}
                                                  </div>
                                              );
                                          }

                                          if (key === 'puasaSenin' || key === 'puasaKamis') {
                                              return (
                                                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                      <span className="text-sm font-semibold text-slate-700">{ITEM_LABELS[key]}</span>
                                                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${cap ? 'bg-teal-100 text-teal-700' : tar === 0 ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
                                                          {tar === 0 ? 'Tidak Wajib' : cap ? 'Sudah' : 'Belum'}
                                                      </span>
                                                  </div>
                                              );
                                          }

                                          return (
                                              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                  <span className="text-sm font-semibold text-slate-700">{ITEM_LABELS[key]}</span>
                                                  <div className="flex items-center gap-3">
                                                      <span className="text-xs font-medium text-slate-500">T: {tar}</span>
                                                      <span className={`text-sm font-black ${pct >= 80 ? t.primaryText : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{cap}</span>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          );
                      })}
                  </>
              )}
          </div>
      </div>
   );
};

const GuruForm = ({ guruList, onBack, t }: any) => {
  const [nama, setNama] = useState('');
  const [bulan, setBulan] = useState(CURRENT_MONTH_NAME);
  const [pekan, setPekan] = useState('1');
  
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [filledWeeks, setFilledWeeks] = useState<string[]>([]);
  
  const [form, setForm] = useState({
      targetJamaah: 35, sholatJamaah: 0,
      targetMalam: 2, sholatMalam: 0,
      targetDhuha: 2, sholatDhuha: 0,
      targetTilawah: 7, tilawah: 0,
      targetPuasaSenin: 1, puasaSenin: false,
      targetPuasaKamis: 1, puasaKamis: false,
      targetPerangkat: 1, perangkat: false, perangkatAjarObj: null as any, existingPerangkatUrl: "",
      targetDzikir: 14, dzikir: 0,
      targetMendoakan: 7, mendoakan: 0,
      targetInfaq: 1, infaq: 0,
      targetBacaBuku: 1, bacaBuku: 0,
      targetOlahraga: 1, olahraga: 0,
      targetMenyapa: 5, menyapaSiswa: 0
  });

  const updateForm = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
      if (nama && bulan) {
          const fetchFilled = async () => {
              try {
                  const res = await fetch(`${YAUMIYAH_GAS_URL}?action=getFilledWeeks&nama=${encodeURIComponent(nama)}&bulan=${encodeURIComponent(bulan)}`);
                  const result = await res.json();
                  setFilledWeeks(result || []);
              } catch (e) {}
          };
          fetchFilled();
      }
  }, [nama, bulan]);

  const handleCheck = async () => {
      if (!nama || !bulan || !pekan) { setToast({msg: 'Lengkapi Nama, Bulan, dan Pekan', type: 'error'}); return; }
      setIsChecking(true);
      try {
          const res = await fetch(`${YAUMIYAH_GAS_URL}?action=checkLaporan&nama=${encodeURIComponent(nama)}&bulan=${encodeURIComponent(bulan)}&pekan=${encodeURIComponent(pekan)}`);
          const result = await res.json();
          if (result && result.found) {
              setForm({
                  targetJamaah: result.targetJamaah, sholatJamaah: result.sholatJamaah,
                  targetMalam: result.targetMalam, sholatMalam: result.sholatMalam,
                  targetDhuha: result.targetDhuha, sholatDhuha: result.sholatDhuha,
                  targetTilawah: result.targetTilawah, tilawah: result.tilawah,
                  targetPuasaSenin: result.targetPuasaSenin, puasaSenin: result.puasaSenin,
                  targetPuasaKamis: result.targetPuasaKamis, puasaKamis: result.puasaKamis,
                  targetPerangkat: result.targetPerangkat, perangkat: result.perangkat === 1 || result.perangkat === "Ya",
                  perangkatAjarObj: null, existingPerangkatUrl: typeof result.perangkat === 'string' && result.perangkat.includes('http') ? result.perangkat : "",
                  targetDzikir: result.targetDzikir, dzikir: result.dzikir,
                  targetMendoakan: result.targetMendoakan, mendoakan: result.mendoakan,
                  targetInfaq: result.targetInfaq, infaq: result.infaq,
                  targetBacaBuku: result.targetBacaBuku, bacaBuku: result.bacaBuku,
                  targetOlahraga: result.targetOlahraga, olahraga: result.olahraga,
                  targetMenyapa: result.targetMenyapa, menyapaSiswa: result.menyapaSiswa
              });
              setToast({msg: 'Data sebelumnya ditemukan', type: 'success'});
          } else {
              setForm(prev => ({...prev, existingPerangkatUrl: "", perangkatAjarObj: null}));
              setToast({msg: 'Belum ada data, silakan isi baru', type: 'success'});
          }
      } catch (e) {
          setToast({msg: 'Gagal mengecek data', type: 'error'});
      } finally {
          setIsChecking(false);
      }
  };

  const handleFileSelect = (file: any) => {
    if (!file) { updateForm('perangkatAjarObj', null); return; }
    if (file.size > 5 * 1024 * 1024) { setToast({msg: 'Ukuran file maksimal 5MB', type: 'error'}); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        updateForm('perangkatAjarObj', { data: e.target?.result, name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!nama || !bulan || !pekan) { setToast({msg: 'Lengkapi Nama, Bulan, dan Pekan', type: 'error'}); return; }
    
    setIsSubmitting(true);
    
    try {
      let finalPerangkatUrl = form.existingPerangkatUrl;
      
      if (form.perangkatAjarObj) {
          const uploadRes = await fetch(YAUMIYAH_GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                  action: 'uploadFile',
                  data: form.perangkatAjarObj.data,
                  fileName: form.perangkatAjarObj.name,
                  teacherName: nama,
                  bulan: bulan,
                  pekan: pekan
              })
          });
          const uploadResult = await uploadRes.json();
          if (uploadResult.success) {
              finalPerangkatUrl = uploadResult.url;
          } else {
              setToast({msg: 'Gagal upload file perangkat ajar', type: 'error'});
              setIsSubmitting(false);
              return;
          }
      }

      const payload = {
        action: 'simpanLaporan',
        nama, bulan, pekan,
        targetJamaah: form.targetJamaah, sholatJamaah: form.sholatJamaah,
        targetMalam: form.targetMalam, sholatMalam: form.sholatMalam,
        targetDhuha: form.targetDhuha, sholatDhuha: form.sholatDhuha,
        targetTilawah: form.targetTilawah, tilawah: form.tilawah,
        targetPuasaSenin: form.targetPuasaSenin, puasaSenin: form.puasaSenin,
        targetPuasaKamis: form.targetPuasaKamis, puasaKamis: form.puasaKamis,
        targetPerangkat: form.targetPerangkat, 
        perangkat: finalPerangkatUrl || (form.perangkat ? "Ya" : "Tidak"), 
        targetDzikir: form.targetDzikir, dzikir: form.dzikir,
        targetMendoakan: form.targetMendoakan, mendoakan: form.mendoakan,
        targetInfaq: form.targetInfaq, infaq: form.infaq,
        targetBacaBuku: form.targetBacaBuku, bacaBuku: form.bacaBuku,
        targetOlahraga: form.targetOlahraga, olahraga: form.olahraga,
        targetMenyapa: form.targetMenyapa, menyapaSiswa: form.menyapaSiswa
      };

      const res = await fetch(YAUMIYAH_GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.success) {
        setToast({ msg: 'Data berhasil disimpan!', type: 'success' });
        setTimeout(() => onBack(), 2000);
      } else {
        setToast({ msg: 'Gagal menyimpan data', type: 'error' });
      }
    } catch (err) {
      setToast({ msg: 'Terjadi kesalahan jaringan', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 animate-slide-up relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      {(isChecking || isSubmitting) && <LoadingOverlay />}
      
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200">
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><ArrowLeft size={20}/></button>
          <h1 className="text-lg font-bold text-slate-800">Form Yaumiyah</h1>
          <button onClick={handleSubmit} disabled={isSubmitting} className={`${t.primaryText} p-2 -mr-2 rounded-full hover:bg-teal-50 transition-colors disabled:opacity-50`}><Save size={20}/></button>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-md mx-auto">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nama Guru</label>
              <div className="relative">
                <select value={nama} onChange={e=>setNama(e.target.value)} className="w-full p-3.5 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-slate-200 transition-all">
                  <option value="">-- Pilih Nama --</option>
                  {guruList.map((g: any) => <option key={g.id} value={g.nama}>{g.nama}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bulan</label>
                <div className="relative">
                  <select value={bulan} onChange={e=>setBulan(e.target.value)} className="w-full p-3.5 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-slate-200 transition-all">
                    {MONTH_NAMES.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-4 text-slate-400 pointer-events-none" size={18}/>
                </div>
              </div>
              <div className="w-1/3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Pekan</label>
                <div className="relative">
                  <select value={pekan} onChange={e=>setPekan(e.target.value)} className="w-full p-3.5 pl-4 pr-8 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-slate-200 transition-all">
                    {[1,2,3,4,5].map(p=><option key={p} value={p}>P{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-4 text-slate-400 pointer-events-none" size={18}/>
                </div>
              </div>
            </div>
            
            {filledWeeks.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0"/>
                    <div>
                        <p className="text-xs font-bold text-amber-800">Info Pekan Terisi</p>
                        <p className="text-[10px] text-amber-700 mt-0.5">Pekan {filledWeeks.join(', ')} sudah diisi. Memilih pekan ini akan menimpa data lama.</p>
                    </div>
                </div>
            )}

            <button onClick={handleCheck} disabled={!nama || isChecking} className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${nama ? `${t.primaryBg} text-white shadow-md hover:opacity-90` : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
              <RotateCcw size={18} className={isChecking ? 'animate-spin' : ''}/> Cek / Tarik Data
            </button>
          </div>
        </div>

        <div className={!nama ? 'opacity-50 pointer-events-none grayscale transition-all duration-500' : 'transition-all duration-500'}>
            <SectionHeader title="Ibadah Utama" />
            <CounterInput label="Sholat Jamaah" value={form.sholatJamaah} target={form.targetJamaah} onChange={(v: any)=>updateForm('sholatJamaah',v)} onTargetChange={(v: any)=>updateForm('targetJamaah',v)} unit="Waktu" t={t} />
            <CounterInput label="Sholat Malam" value={form.sholatMalam} target={form.targetMalam} onChange={(v: any)=>updateForm('sholatMalam',v)} onTargetChange={(v: any)=>updateForm('targetMalam',v)} unit="Hari" t={t} />
            <CounterInput label="Sholat Dhuha" value={form.sholatDhuha} target={form.targetDhuha} onChange={(v: any)=>updateForm('sholatDhuha',v)} onTargetChange={(v: any)=>updateForm('targetDhuha',v)} unit="Hari" t={t} />
            <CounterInput label="Tilawah Al-Qur'an" value={form.tilawah} target={form.targetTilawah} onChange={(v: any)=>updateForm('tilawah',v)} onTargetChange={(v: any)=>updateForm('targetTilawah',v)} unit="Hari" t={t} />
            <PuasaToggle label="Puasa Senin" checked={form.puasaSenin} target={form.targetPuasaSenin} onChange={(v: any)=>updateForm('puasaSenin',v)} onTargetChange={(v: any)=>updateForm('targetPuasaSenin',v)} t={t} />
            <PuasaToggle label="Puasa Kamis" checked={form.puasaKamis} target={form.targetPuasaKamis} onChange={(v: any)=>updateForm('puasaKamis',v)} onTargetChange={(v: any)=>updateForm('targetPuasaKamis',v)} t={t} />

            <SectionHeader title="Profesional & Dzikir" />
            <FileInput label="Perangkat Ajar (RPP/Modul)" existingUrl={form.existingPerangkatUrl} onFileSelect={handleFileSelect} t={t} />
            <CounterInput label="Dzikir Pagi/Petang" value={form.dzikir} target={form.targetDzikir} onChange={(v: any)=>updateForm('dzikir',v)} onTargetChange={(v: any)=>updateForm('targetDzikir',v)} unit="Kali" t={t} />

            <SectionHeader title="Sosial & Lainnya" />
            <CounterInput label="Mendoakan Sesama" value={form.mendoakan} target={form.targetMendoakan} onChange={(v: any)=>updateForm('mendoakan',v)} onTargetChange={(v: any)=>updateForm('targetMendoakan',v)} unit="Hari" t={t} />
            <CounterInput label="Infaq" value={form.infaq} target={form.targetInfaq} onChange={(v: any)=>updateForm('infaq',v)} onTargetChange={(v: any)=>updateForm('targetInfaq',v)} unit="Kali" t={t} />
            <CounterInput label="Membaca Buku" value={form.bacaBuku} target={form.targetBacaBuku} onChange={(v: any)=>updateForm('bacaBuku',v)} onTargetChange={(v: any)=>updateForm('targetBacaBuku',v)} unit="Buku" t={t} />
            <CounterInput label="Olahraga" value={form.olahraga} target={form.targetOlahraga} onChange={(v: any)=>updateForm('olahraga',v)} onTargetChange={(v: any)=>updateForm('targetOlahraga',v)} unit="Kali" t={t} />
            <CounterInput label="Menyapa Siswa" value={form.menyapaSiswa} target={form.targetMenyapa} onChange={(v: any)=>updateForm('menyapaSiswa',v)} onTargetChange={(v: any)=>updateForm('targetMenyapa',v)} unit="Hari" t={t} />

            <button onClick={handleSubmit} disabled={isSubmitting} className={`w-full mt-8 py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : `${t.primaryBg} hover:opacity-90`}`}>
              {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
              {isSubmitting ? 'Menyimpan...' : 'Kirim Laporan'}
            </button>
        </div>
      </div>
    </div>
  );
};
"""
content4 = """
export const YaumiyahView1 = ({ themeColor, onBack }: any) => {
  const t = getTheme(themeColor);
  const [view, setView] = useState<'landing'|'guru-login'|'admin-login'|'dashboard'|'rekap'|'form'|'detail'>('landing');
  const [guruList, setGuruList] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [selectedGuru, setSelectedGuru] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      const fetchGuru = async () => {
          try {
              const res = await fetch(`${YAUMIYAH_GAS_URL}?action=getDataGuru`);
              const data = await res.json();
              if (data && data.data) {
                  setGuruList(data.data.map((row: any, i: number) => ({ id: i, nama: row[1] })).filter((g: any) => g.nama));
              }
          } catch (e) {}
      };
      fetchGuru();
  }, []);

  const fetchAllData = async () => {
      setIsLoading(true);
      try {
          const res = await fetch(`${YAUMIYAH_GAS_URL}?action=getAllLaporan`);
          const data = await res.json();
          if (data && data.data) {
              const processed = processRawData(data.data);
              setAllData(processed);
          }
      } catch (e) {}
      setIsLoading(false);
  };

  const handleAdminLogin = () => {
      setView('dashboard');
      fetchAllData();
  };

  const handleGuruLogin = () => {
      setView('form');
  };

  return (
      <div className="min-h-screen bg-[#F1F5F9] font-sans">
          {view === 'landing' && <LandingPage onSelectGuru={()=>setView('guru-login')} onSelectAdmin={()=>setView('admin-login')} onBack={onBack} t={t} />}
          {view === 'guru-login' && <GuruLogin onLogin={handleGuruLogin} onBack={()=>setView('landing')} t={t} />}
          {view === 'admin-login' && <AdminLogin onLogin={handleAdminLogin} onBack={()=>setView('landing')} t={t} />}
          {view === 'dashboard' && <Dashboard data={allData} isLoading={isLoading} onRefresh={fetchAllData} onBack={()=>setView('landing')} onSelectGuru={(nama: string)=>{setSelectedGuru(nama); setView('detail');}} onOpenRekap={()=>setView('rekap')} t={t} />}
          {view === 'rekap' && <RekapAllPage data={allData} onBack={()=>setView('dashboard')} t={t} />}
          {view === 'form' && <GuruForm guruList={guruList} onBack={()=>setView('landing')} t={t} />}
          {view === 'detail' && <DetailGuru nama={selectedGuru} data={allData} onBack={()=>setView('dashboard')} t={t} />}
      </div>
  );
};
"""
with open('src/views/YaumiyahView1.tsx', 'a') as f:
    f.write(content4)



