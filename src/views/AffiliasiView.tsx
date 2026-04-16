import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { ArrowLeft, ExternalLink, Handshake, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { LazyImage } from '../components/LazyImage';

const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s/gviz/tq?tqx=out:csv&sheet=dataAffiliasi';

interface AffiliasiData {
  judul: string;
  urlGambar: string;
  deskripsi: string;
  whatsapp: string;
  pesan: string;
}

const renderTitle = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a 
        key={match.index} 
        href={match[2]} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="hover:underline text-blue-600 transition-colors" 
        onClick={(e) => e.stopPropagation()}
      >
        {match[1]}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export function AffiliasiView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const [data, setData] = useState<AffiliasiData[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [ctaWa, setCtaWa] = useState({ number: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      setStatus('loading');
      try {
        const response = await fetch(`${SHEETS_CSV_URL}&t=${new Date().getTime()}`);
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

        const parsedData: AffiliasiData[] = [];
        let defaultWa = '';
        let defaultMsg = 'Halo, saya tertarik untuk menjalin kerja sama dengan MIS IT Al Uswah.';

        if (rows.length > 1) {
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 1) continue;

            const judul = row.length > 0 && row[0] ? row[0].replace(/"/g, '') : '';
            const urlGambar = row.length > 1 && row[1] ? row[1].replace(/"/g, '') : '';
            const deskripsi = row.length > 2 && row[2] ? row[2].replace(/"/g, '') : '';
            let whatsapp = row.length > 3 && row[3] ? row[3].replace(/"/g, '').replace(/\D/g, '') : '';
            if (whatsapp.startsWith('0')) whatsapp = '62' + whatsapp.substring(1);
            const pesan = row.length > 4 && row[4] ? row[4].replace(/"/g, '') : '';

            if (judul) {
              parsedData.push({ judul, urlGambar, deskripsi, whatsapp, pesan });
            }

            // Set the first valid WA as the default for CTA
            if (!defaultWa && whatsapp) {
              defaultWa = whatsapp;
              if (pesan) defaultMsg = pesan;
            }
          }
        }
        
        setData(parsedData);
        setCtaWa({ number: defaultWa, message: defaultMsg });
        setStatus('success');
      } catch (error) {
        console.error("Error fetching affiliasi data:", error);
        setStatus('error');
      }
    };

    fetchData();
  }, []);

  // Removed handleWhatsAppClick as we will use <a> tags directly


  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Header */}
      <div 
        className={`shrink-0 sticky top-0 z-40 px-4 py-3 flex items-center gap-3 shadow-md ${t.primaryBg} text-white`}
      >
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Affiliasi & Kerja Sama</h1>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-20">
        {/* Hero Section */}
        <div className={`relative bg-gradient-to-br ${t.gradient} pt-10 pb-16 px-4 text-center overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 text-white shadow-lg">
              <Handshake size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 drop-shadow-md">
              {title || "Mitra & Affiliasi"}
            </h2>
            <p className="text-white/90 font-medium text-sm md:text-base max-w-xl mx-auto drop-shadow">
              Daftar mitra resmi dan program affiliasi yang bekerja sama dengan MIS IT Al Uswah.
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-5xl mx-auto -mt-8 relative z-20">
          {/* Cards */}
          {status === 'loading' ? (
            <div className="flex justify-center items-center py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className={`animate-spin rounded-full h-10 w-10 border-b-2 border-current ${t.primaryText}`}></div>
            </div>
          ) : status === 'error' ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-center mb-6 border border-red-100 shadow-sm">
              <p className="font-medium">Gagal memuat data affiliasi. Pastikan sheet "dataAffiliasi" sudah dibuat.</p>
            </div>
          ) : data.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake size={32} />
              </div>
              <p className="text-gray-500 font-medium">Belum ada data affiliasi saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-8">
              {data.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {item.urlGambar && (
                    <div className="h-48 p-8 bg-white flex items-center justify-center border-b border-gray-100 relative overflow-hidden group-hover:bg-gray-50/50 transition-colors duration-300">
                      <LazyImage 
                        src={item.urlGambar} 
                        alt={item.judul} 
                        containerClassName="w-full h-full flex items-center justify-center bg-transparent"
                        className="max-w-full max-h-full object-contain relative z-10 drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.judul}/400/300`;
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 leading-tight mb-3 group-hover:text-blue-600 transition-colors">
                      {renderTitle(item.judul)}
                    </h3>
                    <p className="text-gray-600 text-sm mb-6 flex-1 leading-relaxed">{item.deskripsi}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-10 text-center border border-blue-100 shadow-sm mt-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl -ml-10 -mb-10"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Mari Menjalin Kerja Sama</h3>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
                MIS IT Al Uswah membuka peluang kerja sama dan affiliasi dengan berbagai pihak untuk memajukan pendidikan yang berkualitas.
              </p>
              
              {ctaWa.number ? (
                <a 
                  href={`https://wa.me/${ctaWa.number}?text=${encodeURIComponent(ctaWa.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${t.primaryBg}`}
                >
                  <Handshake size={22} />
                  Ajukan Kerja Sama Sekarang
                </a>
              ) : (
                <button 
                  onClick={() => alert('Nomor WhatsApp belum dikonfigurasi di Google Sheets (Kolom D).')}
                  className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg ${t.primaryBg} opacity-80`}
                >
                  <Handshake size={22} />
                  Ajukan Kerja Sama Sekarang
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
