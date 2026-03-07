import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, Check, Copy, Search } from 'lucide-react';
import { ThemeConfig } from '../types';
import { databaseWilayah } from '../utils/wilayah';
import { SCRIPT_URL } from '../context/DataContext';

function toProperCase(str: string) {
  return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function calculateAgeOnJuly(birthDate: Date, year: number) {
  const julyFirst = new Date(year, 6, 31);
  const birth = new Date(birthDate);
  let age = julyFirst.getFullYear() - birth.getFullYear();
  const monthDiff = julyFirst.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && julyFirst.getDate() < birth.getDate())) age--;
  return age;
}

export function SPMBModal({ t, onClose }: { t: ThemeConfig, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'daftar' | 'cek'>('daftar');
  const [toast, setToast] = useState<{ message: string, type: 'warning' | 'error' | 'success' } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nama_panggilan: '',
    jenis_kelamin: '',
    tgl_lahir: '',
    tapel: '',
    asal_sekolah: '',
    nama_ayah: '',
    pekerjaan_ayah: '',
    nama_ibu: '',
    pekerjaan_ibu: '',
    alamat_rt: '',
    alamat_rw: '',
    alamat_desa: '',
    alamat_kecamatan: '',
    alamat_kabupaten: '',
    nomor_hp: '',
    sumber_info_check: ''
  });

  const [ageInfo, setAgeInfo] = useState<{ text: React.ReactNode, isUnder3: boolean } | null>(null);
  const [tapelOptions, setTapelOptions] = useState<{ value: string, label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'warning', content: any } | null>(null);
  const [phoneWarning, setPhoneWarning] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const phoneWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (phoneWarningTimeoutRef.current) clearTimeout(phoneWarningTimeoutRef.current);
    };
  }, []);

  // Cek Status State
  const [cekToken, setCekToken] = useState('');
  const [cekResult, setCekResult] = useState<{ type: 'success' | 'error', data?: any, message?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Modal Closed State
  const [closedTapel, setClosedTapel] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const showToast = (message: string, type: 'warning' | 'error' | 'success' = 'warning') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (['nama_lengkap', 'nama_panggilan', 'nama_ayah', 'nama_ibu', 'alamat_desa', 'alamat_kecamatan', 'alamat_kabupaten', 'pekerjaan_ayah', 'pekerjaan_ibu'].includes(name)) {
      newValue = newValue.replace(/[^a-zA-Z\s'.]/g, '');
    }
    if (name === 'asal_sekolah') {
      newValue = newValue.toUpperCase();
    }
    if (['alamat_rt', 'alamat_rw'].includes(name)) {
      newValue = newValue.replace(/[^0-9]/g, '').slice(0, 3);
    }
    if (name === 'nomor_hp') {
      if (newValue.startsWith('0')) {
        setPhoneWarning(true);
        newValue = newValue.substring(1);
        if (phoneWarningTimeoutRef.current) clearTimeout(phoneWarningTimeoutRef.current);
        phoneWarningTimeoutRef.current = setTimeout(() => setPhoneWarning(false), 3000);
      } else {
        setPhoneWarning(false);
      }
      newValue = newValue.replace(/[^0-9]/g, '').slice(0, 13);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Auto-fill Kecamatan & Kabupaten based on Desa
    if (name === 'alamat_desa') {
      const match = Object.keys(databaseWilayah).find(key => key.toLowerCase() === newValue.toLowerCase());
      if (match) {
        setFormData(prev => ({
          ...prev,
          alamat_desa: newValue,
          alamat_kecamatan: databaseWilayah[match][0],
          alamat_kabupaten: databaseWilayah[match][1]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          alamat_desa: newValue,
          alamat_kecamatan: '',
          alamat_kabupaten: ''
        }));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (['nama_lengkap', 'nama_panggilan', 'nama_ayah', 'nama_ibu', 'alamat_desa', 'alamat_kecamatan', 'alamat_kabupaten', 'pekerjaan_ayah', 'pekerjaan_ibu'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: toProperCase(value) }));
    }
  };

  useEffect(() => {
    if (!formData.tgl_lahir) {
      setAgeInfo(null);
      setTapelOptions([]);
      return;
    }

    const birthDate = new Date(formData.tgl_lahir);
    const currentYear = new Date().getFullYear();
    const ageThisJuly = calculateAgeOnJuly(birthDate, currentYear);
    
    const isUnder3 = ageThisJuly < 3;
    
    if (isUnder3) {
      setAgeInfo({
        text: <><span className="block">Usia per Juli {currentYear}: {ageThisJuly} tahun.</span><span className="text-amber-600 font-bold text-xs mt-1 block animate-pulse">⚠️ Usia dini (Asal Sekolah tidak wajib diisi).</span></>,
        isUnder3: true
      });
      setFormData(prev => ({ ...prev, asal_sekolah: '-' }));
    } else {
      setAgeInfo({
        text: `Usia per Juli ${currentYear}: ${ageThisJuly} tahun`,
        isUnder3: false
      });
      if (formData.asal_sekolah === '-') {
        setFormData(prev => ({ ...prev, asal_sekolah: '' }));
      }
    }

    let idealYear = (ageThisJuly >= 6) ? currentYear : currentYear + (6 - ageThisJuly);
    const newOptions = [];
    
    for (let i = 0; i < 2; i++) {
      const year = idealYear + i;
      const tahunAjaran = `${year}/${year + 1}`;
      
      const targetDate = new Date(year, 6, 31);
      let y = targetDate.getFullYear() - birthDate.getFullYear();
      let m = targetDate.getMonth() - birthDate.getMonth();
      const d = targetDate.getDate() - birthDate.getDate();

      if (d < 0) m--;
      if (m < 0) { y--; m += 12; }
      
      const ageDetail = `(Usia per 1 Juli: ${y} thn ${m} bln)`;
      newOptions.push({
        value: tahunAjaran,
        label: `${tahunAjaran} ${ageDetail}${i === 0 ? ' ✅' : ''}`
      });
    }
    
    setTapelOptions(newOptions);
    if (!formData.tapel || !newOptions.find(o => o.value === formData.tapel)) {
      setFormData(prev => ({ ...prev, tapel: newOptions[0].value }));
      verifyTapelStatus(newOptions[0].value);
    }
  }, [formData.tgl_lahir]);

  const verifyTapelStatus = async (selectedTapel: string) => {
    if (!selectedTapel) return;
    try {
      const response = await fetch(`${SCRIPT_URL}?action=checkTapel&tapel=${encodeURIComponent(selectedTapel)}`);
      const text = await response.text();
      let result;
      try { result = JSON.parse(text); } catch (err) { return; }
      
      const status = (result.status || "Buka").toLowerCase().trim();
      if (status === "tutup" || status === "penuh") {
        setClosedTapel(selectedTapel);
      } 
    } catch (e) {
      console.error("Gagal cek status tapel", e);
    }
  };

  const handleTapelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, tapel: val }));
    verifyTapelStatus(val);
  };

  const isDuplicate = (name: string, dob: string) => {
    const history = JSON.parse(localStorage.getItem('ppdb_history') || '[]');
    const cleanName = name.toLowerCase().trim();
    return history.some((item: any) => item.name.toLowerCase().trim() === cleanName && item.dob === dob);
  };

  const saveToHistory = (data: any) => {
    const history = JSON.parse(localStorage.getItem('ppdb_history') || '[]');
    history.push(data);
    localStorage.setItem('ppdb_history', JSON.stringify(history));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      const invalidField = form.querySelector(':invalid') as any;
      if (invalidField) {
        let labelText = "Kolom ini";
        if (invalidField.name === 'sumber_info_check') labelText = "Sumber Informasi";
        else if (invalidField.id) {
          const label = document.querySelector(`label[for="${invalidField.id}"]`);
          if (label) labelText = (label as HTMLElement).innerText;
        }
        showToast(`Mohon lengkapi ${labelText}`, 'warning');
        invalidField.focus();
      }
      return;
    }

    if (isDuplicate(formData.nama_lengkap, formData.tgl_lahir)) {
      setStatusMsg({
        type: 'warning',
        content: `Siswa atas nama <strong>${formData.nama_lengkap}</strong> dengan tanggal lahir tersebut sudah terdaftar di perangkat ini.`
      });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      if (SCRIPT_URL.startsWith('https://script.google.com')) {
        const validateUrl = `${SCRIPT_URL}?action=validate&nama=${encodeURIComponent(formData.nama_lengkap)}&tgl=${encodeURIComponent(formData.tgl_lahir)}`;
        const response = await fetch(validateUrl);
        const result = await response.json();
        if (result.status === 'duplicate') {
          setStatusMsg({
            type: 'warning',
            content: `<strong>DATA GANDA DITOLAK!</strong><br>Siswa atas nama <strong>${formData.nama_lengkap}</strong> sudah terdaftar di sistem kami.`
          });
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Validasi pre-flight gagal");
    }

    const submitData = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'nomor_hp') submitData.append(key, '62' + String(value));
      else submitData.append(key, String(value));
    });
    submitData.append('tanggal_lahir', formData.tgl_lahir);
    submitData.append('tahun_pelajaran', formData.tapel);
    submitData.append('timestamp', new Date().toLocaleString('id-ID'));

    try {
      if (!SCRIPT_URL.startsWith('https://script.google.com')) {
        await new Promise(r => setTimeout(r, 1500));
        const demoToken = "DEMO-" + Math.floor(Math.random() * 10000);
        const data = { name: formData.nama_lengkap, dob: formData.tgl_lahir, token: demoToken, tapel: formData.tapel, school: formData.asal_sekolah };
        saveToHistory(data);
        setStatusMsg({ type: 'success', content: data });
      } else {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: submitData.toString()
        });
        const result = await response.json();
        if (result.status === 'success') {
          const data = { name: formData.nama_lengkap, dob: formData.tgl_lahir, token: result.token, tapel: formData.tapel, school: formData.asal_sekolah };
          saveToHistory(data);
          setStatusMsg({ type: 'success', content: data });
        } else {
          setStatusMsg({ type: 'error', content: result.message || 'Terjadi kesalahan pada server.' });
        }
      }
    } catch (error) {
      setStatusMsg({ type: 'error', content: 'Terjadi kesalahan jaringan atau CORS. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckToken = async () => {
    if (!cekToken.trim()) {
      setCekResult({ type: 'error', message: 'Silakan masukkan token terlebih dahulu.' });
      return;
    }

    setIsChecking(true);
    setCekResult(null);

    try {
      if (SCRIPT_URL.startsWith('https://script.google.com')) {
        const response = await fetch(`${SCRIPT_URL}?action=check&token=${encodeURIComponent(cekToken.trim().toUpperCase())}`);
        const result = await response.json();
        if (result.status === 'found') {
          setCekResult({ type: 'success', data: result });
        } else {
          setCekResult({ type: 'error', message: `Data dengan token ${cekToken} tidak ada di database kami.` });
        }
      } else {
        await new Promise(r => setTimeout(r, 1000));
        setCekResult({ type: 'error', message: `Data dengan token ${cekToken} tidak ada di database kami.` });
      }
    } catch (error) {
      setCekResult({ type: 'error', message: 'Gagal menghubungi server. Periksa koneksi internet Anda.' });
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Token tersalin!', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto bg-gradient-to-br ${t.gradient} custom-scrollbar`}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border-l-4 ${toast.type === 'warning' ? 'border-amber-500' : toast.type === 'error' ? 'border-red-500' : 'border-emerald-500'}`}
          >
            {toast.type === 'warning' && <AlertCircle className="text-amber-500" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
            {toast.type === 'success' && <Check className="text-emerald-500" size={20} />}
            <span className="font-semibold text-gray-800 text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg relative z-10 p-4 py-10 flex flex-col min-h-full">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8 mt-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md leading-tight">
            FORM <span className="text-amber-300">REGISTRASI</span>
          </h1>
          <p className="text-white text-lg sm:text-xl font-bold tracking-wide uppercase mt-3 drop-shadow-sm">
            MIS ISLAM TERPADU AL USWAH
          </p>
          <p className="text-white/80 text-sm sm:text-base font-medium mt-2 italic tracking-wide">
            "Terwujudnya Generasi Qur'ani, Mandiri, dan Berprestasi"
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl relative flex flex-col mb-10">
          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${t.gradient} z-20 rounded-t-3xl`}></div>
          
          <div className="flex border-b border-gray-200 relative z-10 bg-gray-50 shrink-0 rounded-t-3xl overflow-hidden">
            <button 
              onClick={() => setActiveTab('daftar')} 
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-b-2 ${activeTab === 'daftar' ? `${t.primaryText} border-current bg-white` : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-white'}`}
            >
              Daftar Baru
            </button>
            <button 
              onClick={() => setActiveTab('cek')} 
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-b-2 ${activeTab === 'cek' ? `${t.primaryText} border-current bg-white` : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-white'}`}
            >
              Cek Status
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'daftar' && (
              <div className="animate-in fade-in duration-300">
                {!statusMsg ? (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap Calon Siswa</label>
                      <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} onBlur={handleBlur} required placeholder="Sesuai Akta Kelahiran" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nama Panggilan</label>
                      <input type="text" name="nama_panggilan" value={formData.nama_panggilan} onChange={handleInputChange} onBlur={handleBlur} required placeholder="Nama Panggilan Sehari-hari" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Kelamin</label>
                      <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} required className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`}>
                        <option value="">-- Pilih Jenis Kelamin --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Lahir</label>
                      <input type="date" name="tgl_lahir" value={formData.tgl_lahir} onChange={handleInputChange} required max={new Date().toISOString().split('T')[0]} className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                      {ageInfo && (
                        <p className="mt-2 text-xs">
                          <span className={`inline-flex flex-col px-3 py-2 rounded-lg font-medium ${t.primaryLightBg} ${t.primaryText}`}>
                            {ageInfo.text}
                          </span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tahun Pelajaran</label>
                      <select name="tapel" value={formData.tapel} onChange={handleTapelChange} required className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`}>
                        {tapelOptions.length === 0 ? <option value="">-- Pilih tanggal lahir terlebih dahulu --</option> : tapelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Asal Sekolah (TK/RA)</label>
                      <input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleInputChange} required={!ageInfo?.isUnder3} readOnly={ageInfo?.isUnder3} placeholder={ageInfo?.isUnder3 ? "Belum Sekolah (Usia Dini)" : "Nama TK/RA asal"} className={`w-full px-4 py-3 ${ageInfo?.isUnder3 ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nama Ayah / Wali</label>
                      <input type="text" name="nama_ayah" value={formData.nama_ayah} onChange={handleInputChange} onBlur={handleBlur} required placeholder="Nama lengkap ayah" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Pekerjaan Ayah</label>
                      <input type="text" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleInputChange} onBlur={handleBlur} required placeholder="Cth: Wiraswasta" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nama Ibu</label>
                      <input type="text" name="nama_ibu" value={formData.nama_ibu} onChange={handleInputChange} onBlur={handleBlur} required placeholder="Nama lengkap ibu" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Pekerjaan Ibu</label>
                      <input type="text" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleInputChange} onBlur={handleBlur} required placeholder="Cth: Ibu Rumah Tangga" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-1 ${t.primaryBg} rounded-full`}></div>
                        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">Detail Alamat</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-4 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase text-center">RT</label>
                            <input type="text" name="alamat_rt" value={formData.alamat_rt} onChange={handleInputChange} required placeholder="001" className={`w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-center focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase text-center">RW</label>
                            <input type="text" name="alamat_rw" value={formData.alamat_rw} onChange={handleInputChange} required placeholder="003" className={`w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-center focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                          </div>
                        </div>
                        <div className="sm:col-span-8">
                          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Desa / Kelurahan</label>
                          <input list="list-desa" name="alamat_desa" value={formData.alamat_desa} onChange={handleInputChange} onBlur={handleBlur} required placeholder="Ketik nama desa..." className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                          <datalist id="list-desa">
                            {Object.keys(databaseWilayah).sort().map(desa => <option key={desa} value={desa} />)}
                          </datalist>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Kecamatan</label>
                          <input type="text" name="alamat_kecamatan" value={formData.alamat_kecamatan} onChange={handleInputChange} onBlur={handleBlur} placeholder="Otomatis / Ketik Manual" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Kabupaten / Kota</label>
                          <input type="text" name="alamat_kabupaten" value={formData.alamat_kabupaten} onChange={handleInputChange} onBlur={handleBlur} placeholder="Otomatis / Ketik Manual" className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nomor HP / WhatsApp</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-gray-500 font-bold">62</span>
                          <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        </div>
                        <input type="tel" name="nomor_hp" value={formData.nomor_hp} onChange={handleInputChange} required maxLength={12} placeholder="81234567890" pattern="[0-9]{9,13}" className={`w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                      </div>
                      {phoneWarning && (
                        <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle size={14} /> Gunakan format 62 tanpa awalan 0. Contoh: 628123456789
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Dari manakah Ayah/Bunda mengenal sekolah kami?</label>
                      <div className="space-y-3">
                        {[
                          { val: 'Rekomendasi', desc: '(Teman, Keluarga, Alumni, atau Orang Tua Siswa)' },
                          { val: 'Media Sosial & Internet', desc: '(Instagram, Facebook, TikTok, atau Website)' },
                          { val: 'Sekolah Asal', desc: '(Informasi dari Guru atau Sosialisasi di TK/RA)' },
                          { val: 'Lingkungan Sekitar', desc: '(Kegiatan & Program Sekolah, atau Sering melewati sekolah)' }
                        ].map(opt => (
                          <label key={opt.val} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.sumber_info_check === opt.val ? `${t.primaryLightBg} border-current` : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                            <input type="radio" name="sumber_info_check" value={opt.val} checked={formData.sumber_info_check === opt.val} onChange={handleInputChange} required className={`mt-1 w-4 h-4 ${t.primaryText}`} />
                            <div className="flex flex-col">
                              <span className="text-gray-700 text-sm font-semibold">{opt.val}</span>
                              <span className="text-gray-500 text-xs">{opt.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button type="submit" disabled={isLoading} className={`w-full py-4 bg-gradient-to-r ${t.gradient} text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}>
                      {isLoading ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Mengirim...</>
                      ) : (
                        <>Daftar Sekarang <Check size={20} /></>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {statusMsg.type === 'success' && (
                      <div className={`bg-gradient-to-r ${t.primaryLightBg} border-2 border-current rounded-2xl p-6 mb-4`}>
                        <div className="text-center">
                          <h3 className={`text-lg font-bold ${t.primaryText} mb-1`}>✅ Registrasi Berhasil!</h3>
                          <p className={`text-sm mb-4 leading-relaxed ${t.primaryText}`}>
                            Ananda <strong>{statusMsg.content.name}</strong> terdaftar sebagai calon siswa inden <strong>MIS IT Al Uswah Pasirian</strong> pada Tahun Pelajaran <strong>{statusMsg.content.tapel}</strong>
                          </p>
                          <p className={`text-sm mb-3 ${t.primaryText}`}>Token pendaftaran Anda:</p>
                          <div className="bg-white border-2 border-current rounded-xl p-4 mb-3">
                            <p onClick={() => copyToClipboard(statusMsg.content.token)} className={`text-2xl sm:text-3xl font-bold text-center tracking-wider cursor-pointer hover:opacity-80 active:scale-95 transition-all select-none ${t.primaryText}`} title="Klik untuk menyalin token">
                              {statusMsg.content.token}
                            </p>
                          </div>
                          <p className={`text-xs flex items-center justify-center gap-1 ${t.primaryText}`}>
                            <Check size={14} /> Simpan token ini sebagai bukti pendaftaran.
                          </p>
                        </div>
                      </div>
                    )}
                    {statusMsg.type === 'error' && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="text-red-500" size={32} />
                          <div>
                            <h3 className="text-red-800 font-semibold">Gagal Mengirim Data</h3>
                            <p className="text-red-600 text-sm">{statusMsg.content}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {statusMsg.type === 'warning' && (
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="text-amber-500" size={32} />
                          <div>
                            <h3 className="text-amber-800 font-semibold">Perhatian</h3>
                            <p className="text-amber-600 text-sm" dangerouslySetInnerHTML={{ __html: statusMsg.content }}></p>
                          </div>
                        </div>
                      </div>
                    )}
                    <button onClick={() => { setStatusMsg(null); setFormData(prev => ({ ...prev, nama_lengkap: '', tgl_lahir: '' })); }} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 active:scale-95">
                      Daftar Siswa Lain
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cek' && (
              <div className="animate-in fade-in duration-300 text-center space-y-6 py-3">
                <div className={`w-16 h-16 ${t.primaryLightBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Search className={`w-8 h-8 ${t.primaryText}`} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">Cek Status Pendaftaran</h3>
                  <p className="text-gray-500 text-sm">Masukkan Token yang Anda dapatkan saat mendaftar</p>
                </div>
                <div className="max-w-xs mx-auto space-y-4">
                  <input type="text" value={cekToken} onChange={e => setCekToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheckToken()} placeholder="Contoh: REG25-AZ-9X2A" className={`w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-center text-gray-800 font-bold tracking-widest placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-opacity-50 transition-all outline-none uppercase ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`} />
                  <button onClick={handleCheckToken} disabled={isChecking} className={`w-full py-3 ${t.primaryBg} text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-colors active:scale-95 disabled:opacity-70 flex justify-center items-center`}>
                    {isChecking ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Memeriksa...</> : 'Cek Sekarang'}
                  </button>
                </div>
                {cekResult && (
                  <div className="mt-6 text-left">
                    {cekResult.type === 'success' ? (
                      <div className={`bg-white border-2 border-dashed ${t.primaryBg.replace('bg-', 'border-')} p-4 rounded-xl text-center`}>
                        <p className="text-gray-600 mb-2">Data pendaftaran Ananda <strong className={t.primaryText}>{cekResult.data.nama}</strong> berhasil ditemukan untuk Tahun Pelajaran <strong>{cekResult.data.tapel || '(Tahun tidak terekam)'}</strong>.</p>
                        <div onClick={() => copyToClipboard(cekResult.data.token)} className={`inline-block px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold text-lg cursor-pointer hover:bg-gray-100 ${t.primaryText}`}>
                          {cekResult.data.token} <Copy size={16} className="inline ml-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                          <div>
                            <p className="text-red-800 font-bold text-sm">Token Tidak Ditemukan</p>
                            <p className="text-red-600 text-xs mt-1">{cekResult.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-white/80 text-xs mt-4 font-medium">© SPMB Online MIS IT Al Uswah</p>
      </div>

      {/* Closed Modal */}
      <AnimatePresence>
        {closedTapel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 mb-2">Pendaftaran Ditutup</h3>
              <div className="mb-6 space-y-4">
                <p className="text-gray-700 text-base leading-relaxed">
                  Mohon maaf, SPMB Tahun Pelajaran <strong className="text-red-600">{closedTapel}</strong> sudah resmi <strong className="text-red-600">ditutup</strong>.
                </p>
                <p className="font-sans italic mb-2 text-gray-700 text-base leading-relaxed">
                  "Terima kasih atas minat dan kepercayaan Ayah/Bunda terhadap <span className={`${t.primaryText} font-bold italic`}>MIS IT Al Uswah</span>."
                </p>
                <div className={`${t.primaryLightBg} rounded-xl p-4 text-sm text-gray-600 shadow-sm border border-gray-100`}>
                  <p className="font-medium text-gray-700">Untuk informasi lebih lanjut, silakan hubungi narahubung kami.</p>
                </div>
              </div>
              <a href={`https://wa.me/6282333427597?text=${encodeURIComponent(`Assalamu'alaikum Admin, saya ingin menanyakan ketersediaan kuota SPMB untuk Tahun Pelajaran ${closedTapel}, apakah masih bisa mendaftar?`)}`} target="_blank" rel="noreferrer" className={`block w-full py-3 ${t.primaryBg} text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mb-3 shadow-lg active:scale-95`}>
                Hubungi Narahubung
              </a>
              <button onClick={() => { setClosedTapel(null); setFormData(prev => ({ ...prev, tapel: '' })); }} className="text-gray-400 text-sm hover:text-gray-600 font-medium p-2">
                Pilih Tahun Lain
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
