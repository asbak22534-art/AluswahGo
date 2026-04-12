import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ThemeConfig } from '../types';
import { useData, SCRIPT_URL } from '../context/DataContext';

export function KritikView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const { refreshData } = useData();
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    kelas: '',
    jenis: 'Kritik',
    pesan: ''
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const submitData = new URLSearchParams();
    submitData.append('action', 'submitKritik');
    submitData.append('nama', formData.nama || 'Anonim');
    submitData.append('kelas', formData.kelas || '-');
    submitData.append('jenis', formData.jenis);
    submitData.append('pesan', formData.pesan);
    submitData.append('timestamp', new Date().toLocaleString('id-ID'));

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: submitData.toString()
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setIsSent(true);
        setTimeout(() => {
          setIsSent(false);
          onBack();
        }, 2500);
      } else {
        setErrorMsg(result.message || 'Terjadi kesalahan pada server.');
      }
    } catch (error) {
      console.error('Error submitting kritik:', error);
      setErrorMsg('Gagal mengirim pesan. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">{title || "Kritik & Saran"}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-xl mx-auto space-y-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${t.primaryLightBg} ${t.primaryText}`}>
              <MessageSquare size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Sampaikan Aspirasi Anda</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Kritik, saran, dan masukan Anda sangat berarti bagi kemajuan MIS IT Al Uswah. 
              Pesan ini akan dikirimkan langsung ke email Kepala Sekolah secara rahasia.
            </p>

            {errorMsg && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <p className="text-red-600 text-sm">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap (Opsional)</label>
                <input 
                  type="text" 
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all text-gray-800 ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/50')}`} 
                  placeholder="Masukkan nama Anda" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kelas Anak (Opsional)</label>
                <select 
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all text-gray-800 appearance-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/50')}`}
                >
                  <option value="">Pilih Kelas</option>
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                  <option value="3">Kelas 3</option>
                  <option value="4">Kelas 4</option>
                  <option value="5">Kelas 5</option>
                  <option value="6">Kelas 6</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Pesan <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl flex-1 transition-all ${formData.jenis === 'Kritik' ? `${t.primaryLightBg} border-current` : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                    <input 
                      type="radio" 
                      name="jenis" 
                      value="Kritik" 
                      checked={formData.jenis === 'Kritik'} 
                      onChange={handleChange} 
                      className={`w-4 h-4 ${t.primaryText}`}
                    />
                    <span className="text-gray-700 font-medium">Kritik</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl flex-1 transition-all ${formData.jenis === 'Saran' ? `${t.primaryLightBg} border-current` : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                    <input 
                      type="radio" 
                      name="jenis" 
                      value="Saran" 
                      checked={formData.jenis === 'Saran'} 
                      onChange={handleChange} 
                      className={`w-4 h-4 ${t.primaryText}`}
                    />
                    <span className="text-gray-700 font-medium">Saran</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pesan / Kritik / Saran <span className="text-red-500">*</span></label>
                <textarea 
                  required 
                  name="pesan"
                  value={formData.pesan}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all text-gray-800 resize-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/50')}`} 
                  placeholder="Tuliskan pesan Anda di sini..." 
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${t.primaryBg} shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Mengirim...</>
                ) : (
                  <><Send size={20} /> Kirim Pesan</>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {isSent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center justify-center p-8 text-center"
            >
              <div className={`w-20 h-20 ${t.primaryLightBg} ${t.primaryText} rounded-full flex items-center justify-center mb-6`}>
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Terkirim!</h3>
              <p className="text-gray-500">Terima kasih atas masukannya. Pesan Anda telah diteruskan ke Kepala Sekolah.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
