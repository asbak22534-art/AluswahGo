import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, ChevronDown, Book, Sun, Moon, Database } from 'lucide-react';
import { ThemeConfig } from '../types';
import { useData } from '../context/DataContext';

// Format data untuk Google Sheets nantinya
export type DoaSheetItem = {
  judul: string;
  kategori: string; // 'Sholat' | 'Aktivitas' | 'Semua'
  arab: string;
  latin: string;
  arti: string;
};

export type DzikirSheetItem = {
  tipe: 'pagi-sugro' | 'pagi-kubro' | 'petang-sugro' | 'petang-kubro';
  arab: string;
  latin: string;
  arti: string;
};

export type AsmaulHusnaSheetItem = {
  urutan: string | number;
  latin: string;
  arab: string;
  arti: string;
};

const CATEGORIES = ['Semua', 'Sholat', 'Aktivitas'];

export function DoaView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const { data, isLoading } = useData();
  const [activeTab, setActiveTab] = useState<'asmaul-husna' | 'doa' | 'dzikir'>('asmaul-husna');
  const [activeDzikirType, setActiveDzikirType] = useState<'pagi-sugro' | 'pagi-kubro' | 'petang-sugro' | 'petang-kubro'>('pagi-sugro');
  
  const doaList: DoaSheetItem[] = data?.doa || [];
  const dzikirList: DzikirSheetItem[] = data?.dzikir || [];
  const asmaulHusnaList: AsmaulHusnaSheetItem[] = data?.asmaulHusna || [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const filteredDoa = doaList.filter(doa => {
    const matchesSearch = doa.judul?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || doa.kategori === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const currentDzikir = dzikirList.filter(d => d.tipe === activeDzikirType);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg flex-1 text-center pr-10">{title || "Layanan Doa & Dzikir"}</h2>
      </header>

      {/* Main Tabs */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex max-w-3xl mx-auto overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => { setActiveTab('asmaul-husna'); setExpandedId(null); }}
            className={`flex-1 min-w-[120px] py-3 text-center font-bold text-sm transition-colors relative ${activeTab === 'asmaul-husna' ? t.primaryText : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Database size={18} />
              Asmaul Husna
            </div>
            {activeTab === 'asmaul-husna' && (
              <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 right-0 h-1 ${t.primaryBg} rounded-t-full`} />
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('doa'); setExpandedId(null); }}
            className={`flex-1 min-w-[120px] py-3 text-center font-bold text-sm transition-colors relative ${activeTab === 'doa' ? t.primaryText : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Book size={18} />
              Doa Harian
            </div>
            {activeTab === 'doa' && (
              <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 right-0 h-1 ${t.primaryBg} rounded-t-full`} />
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('dzikir'); setExpandedId(null); }}
            className={`flex-1 min-w-[120px] py-3 text-center font-bold text-sm transition-colors relative ${activeTab === 'dzikir' ? t.primaryText : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sun size={18} />
              Dzikir
            </div>
            {activeTab === 'dzikir' && (
              <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 right-0 h-1 ${t.primaryBg} rounded-t-full`} />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'doa' && (
        <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari doa..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/50')}`}
              />
            </div>
            <select 
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="bg-gray-100 py-2.5 px-3 rounded-xl text-sm outline-none border-none text-gray-700 font-medium focus:ring-2 focus:ring-gray-200 shrink-0"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {activeTab === 'dzikir' && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto hide-scrollbar">
            {[
              { id: 'pagi-sugro', label: 'Pagi (Sugro)', icon: <Sun size={14} /> },
              { id: 'pagi-kubro', label: 'Pagi (Kubro)', icon: <Sun size={14} /> },
              { id: 'petang-sugro', label: 'Petang (Sugro)', icon: <Moon size={14} /> },
              { id: 'petang-kubro', label: 'Petang (Kubro)', icon: <Moon size={14} /> },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setActiveDzikirType(type.id as any)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                  activeDzikirType === type.id 
                    ? `${t.primaryLightBg} ${t.primaryText} border-transparent shadow-sm` 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-3 pb-20">
          
          {activeTab === 'asmaul-husna' ? (
            asmaulHusnaList.length === 0 ? (
              <div className="text-center py-16 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Database size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Data Asmaul Husna Kosong</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">
                  Data Asmaul Husna belum tersedia. Nantinya data ini akan ditarik secara otomatis dari Google Sheets.
                </p>
                <div className="mt-6 inline-block text-left bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600">
                  <p className="font-bold mb-2">Format Kolom Google Sheets (Sheet: AsmaulHusna):</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><code className="bg-white px-1 rounded">urutan</code> (Angka 1-99)</li>
                    <li><code className="bg-white px-1 rounded">latin</code> (Teks Latin)</li>
                    <li><code className="bg-white px-1 rounded">arab</code> (Teks Arab)</li>
                    <li><code className="bg-white px-1 rounded">arti</code> (Terjemahan)</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {asmaulHusnaList.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    key={`asmaul-${index}`} 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-full ${t.primaryLightBg} ${t.primaryText} flex items-center justify-center font-bold text-lg`}>
                      {item.urutan || index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{item.latin}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.arti}</p>
                    </div>
                    <div className="text-2xl font-arabic text-right text-gray-900" dir="rtl">
                      {item.arab}
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : activeTab === 'doa' ? (
            doaList.length === 0 ? (
              <div className="text-center py-16 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Database size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Data Doa Kosong</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">
                  Data doa harian belum tersedia. Nantinya data ini akan ditarik secara otomatis dari Google Sheets.
                </p>
                <div className="mt-6 inline-block text-left bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600">
                  <p className="font-bold mb-2">Format Kolom Google Sheets:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><code className="bg-white px-1 rounded">judul</code> (Contoh: Doa Makan)</li>
                    <li><code className="bg-white px-1 rounded">kategori</code> (Sholat / Aktivitas)</li>
                    <li><code className="bg-white px-1 rounded">arab</code> (Teks Arab)</li>
                    <li><code className="bg-white px-1 rounded">latin</code> (Teks Latin)</li>
                    <li><code className="bg-white px-1 rounded">arti</code> (Terjemahan)</li>
                  </ul>
                </div>
              </div>
            ) : filteredDoa.length === 0 ? (
              <div className="text-center py-10 mt-10">
                <p className="text-gray-500">Tidak ada doa yang cocok dengan pencarian "{searchQuery}"</p>
              </div>
            ) : (
              filteredDoa.map((doa, index) => {
                const id = `doa-${index}`;
                const isExpanded = expandedId === id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={id} 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                    >
                      <h3 className="font-bold text-gray-800 text-sm md:text-base pr-4">{doa.judul}</h3>
                      <div className={`shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} className="text-gray-400" />
                      </div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                            <p className="text-3xl md:text-4xl font-arabic leading-[2.5] text-gray-900 text-right mb-5" dir="rtl">
                              {doa.arab}
                            </p>
                            <p className={`text-sm italic mb-3 font-medium leading-relaxed ${t.primaryText}`}>{doa.latin}</p>
                            <p className="text-sm text-gray-800 leading-relaxed">"{doa.arti}"</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )
          ) : (
            dzikirList.length === 0 ? (
              <div className="text-center py-16 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Database size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Data Dzikir Kosong</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">
                  Data dzikir belum tersedia. Nantinya teks dzikir akan digabung menjadi satu bacaan utuh dan ditarik dari Google Sheets.
                </p>
                <div className="mt-6 inline-block text-left bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600">
                  <p className="font-bold mb-2">Format Kolom Google Sheets:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><code className="bg-white px-1 rounded">tipe</code> (pagi-sugro / pagi-kubro / petang-sugro / petang-kubro)</li>
                    <li><code className="bg-white px-1 rounded">arab</code> (Teks Arab Utuh)</li>
                    <li><code className="bg-white px-1 rounded">latin</code> (Teks Latin Utuh)</li>
                    <li><code className="bg-white px-1 rounded">arti</code> (Terjemahan Utuh)</li>
                  </ul>
                </div>
              </div>
            ) : (
              currentDzikir.map((dzikir, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={`dzikir-${index}`} 
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8"
                >
                  <p className="text-3xl md:text-4xl font-arabic leading-[2.5] text-gray-900 text-right mb-8" dir="rtl">
                    {dzikir.arab}
                  </p>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl ${t.primaryLightBg}`}>
                      <h4 className={`font-bold text-sm mb-2 ${t.primaryText}`}>Bacaan Latin:</h4>
                      <p className={`text-sm italic font-medium leading-relaxed ${t.primaryText}`}>{dzikir.latin}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <h4 className="font-bold text-sm mb-2 text-gray-700">Terjemahan:</h4>
                      <p className="text-sm text-gray-800 leading-relaxed">{dzikir.arti}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
