import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Target, Users, BookOpen, Award, GraduationCap, Globe, Facebook, Instagram, Youtube, Video } from 'lucide-react';
import { ThemeConfig } from '../types';
import { useData } from '../context/DataContext';

export function ProfilView({ t, onBack }: { t: ThemeConfig, onBack: () => void }) {
  const { data, isLoading } = useData();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const profil = data?.profil || {};

  const stats = [
    { label: 'Guru & Staf', value: profil.jumlah_guru || '32', icon: <Users size={24} /> },
    { label: 'Siswa Aktif', value: profil.siswa_aktif || '450+', icon: <Users size={24} /> },
    { label: 'Alumni', value: profil.alumni || '1.2K+', icon: <GraduationCap size={24} /> },
    { label: 'Program', value: profil.jumlah_program || '4', icon: <BookOpen size={24} /> },
    { label: 'Ekstrakurikuler', value: profil.jumlah_ekskul || '8', icon: <Award size={24} /> },
  ];

  const socials = [
    { name: 'Website', url: profil.website || 'https://www.misitaluswah.sch.id/', icon: <Globe size={20} />, color: 'bg-blue-500' },
    { name: 'Facebook', url: profil.fb || 'https://www.facebook.com/misitaluswah1', icon: <Facebook size={20} />, color: 'bg-blue-600' },
    { name: 'Instagram', url: profil.ig || 'https://www.instagram.com/misitaluswah/', icon: <Instagram size={20} />, color: 'bg-pink-600' },
    { name: 'Youtube', url: profil.yt || 'https://www.youtube.com/@misitaluswah', icon: <Youtube size={20} />, color: 'bg-red-600' },
    { 
      name: 'Tiktok', 
      url: profil.tiktok || 'https://www.tiktok.com/@misitaluswah', 
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      ), 
      color: 'bg-black' 
    },
  ];

  const waNumber = profil.wa || '6282333427597';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gray-50 z-50 flex flex-col h-full overflow-hidden"
    >
      <header className={`px-4 py-3 flex items-center gap-3 ${t.primaryBg} text-white shadow-md shrink-0`}>
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">Profil Sekolah</h2>
      </header>

      <div className="flex-1 overflow-y-auto w-full pb-24 md:pb-6">
        {/* Hero Section */}
        <div className={`relative bg-gradient-to-br ${t.gradient} pt-12 pb-20 px-4 text-center overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className={`w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 border-4 border-white/20 ${t.primaryText}`}>
              <span className="text-3xl font-extrabold">MI</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-md">
              {profil.nama_sekolah || 'MIS Islam Terpadu Al Uswah'}
            </h1>
            <p className="text-white/90 font-medium text-lg max-w-xl mx-auto drop-shadow">
              {profil.caption || "Membentuk generasi Qur'ani yang cerdas dan berakhlak mulia."}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20 space-y-6">
          
          {/* Card Visi & Alamat */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${t.primaryLightBg} ${t.primaryText}`}>
                    <Target size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Visi Sekolah</h3>
                </div>
                <p className="text-gray-600 leading-relaxed font-medium text-lg">
                  "{profil.visi || "Terwujudnya generasi Qur'ani, Mandiri dan Berprestasi"}"
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${t.primaryLightBg} ${t.primaryText}`}>
                    <MapPin size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Alamat</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {profil.alamat || "Jl. Tegir, RT 01/ RW 01, Kecamatan Pasirian, Kabupaten Lumajang, Jawa Timur 67372"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
                <div className={`p-3 rounded-xl ${t.primaryLightBg} ${t.primaryText} mb-3`}>
                  {stat.icon}
                </div>
                <h4 className="text-2xl font-bold text-gray-800 leading-none mb-1">
                  {isLoading ? '...' : stat.value}
                </h4>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Contact & Social Media */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Hubungi Kami</h3>
            
            <a 
              href={`https://wa.me/${waNumber}?text=Halo%2C%20saya%20ingin%20meminta%20informasi%20terkait%20sekolah%20dan%20SPMB.`} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex flex-wrap items-center justify-center gap-3 px-4 md:px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 mb-8 w-full md:w-auto"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>Chat via WhatsApp</span>
            </a>

            <h3 className="text-lg font-bold text-gray-800 mb-4">Temukan Kami di Sosial Media</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {socials.map((social, idx) => (
                <a 
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 ${social.color}`}
                >
                  {social.icon}
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
