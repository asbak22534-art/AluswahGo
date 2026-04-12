import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { ArrowLeft, ClipboardCheck, Clock, MapPin, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function AbsensiView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [location, setLocation] = useState<string>('Mencari lokasi...');
  const [history, setHistory] = useState([
    { date: '12 Mar 2026', in: '06:45', out: '15:30', status: 'Hadir' },
    { date: '11 Mar 2026', in: '06:50', out: '15:45', status: 'Hadir' },
    { date: '10 Mar 2026', in: '06:42', out: '15:35', status: 'Hadir' },
    { date: '09 Mar 2026', in: '-', out: '-', status: 'Izin' },
    { date: '06 Mar 2026', in: '06:55', out: '15:30', status: 'Hadir' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate getting location
    setTimeout(() => {
      setLocation('MIS IT Al Uswah (Dalam Radius)');
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    const newRecord = {
      date: currentTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      in: currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      out: '-',
      status: 'Hadir'
    };
    setHistory([newRecord, ...history]);
  };

  const handleCheckOut = () => {
    setIsCheckedOut(true);
    setHistory(prev => {
      const newHistory = [...prev];
      newHistory[0].out = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return newHistory;
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      {/* Header */}
      <div className={`shrink-0 sticky top-0 z-40 px-4 py-4 flex items-center gap-3 shadow-sm ${t.primaryBg} text-white`}>
        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">{title || "Absensi Kehadiran"}</h1>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-20">
        {/* Time & Action Card */}
        <div className="p-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${t.primaryBg}`}></div>
            
            <div className="text-slate-500 font-medium mb-1 mt-2">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="text-5xl font-bold text-slate-800 tracking-tight mb-6">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-full mb-8 border border-slate-200">
              <MapPin size={16} className={t.primaryText} />
              <span className="font-medium">{location}</span>
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              <button 
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                  isCheckedIn 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : `${t.primaryBg} text-white shadow-md hover:opacity-90 active:scale-95`
                }`}
              >
                {isCheckedIn ? <CheckCircle2 size={28} className="mb-2" /> : <Clock size={28} className="mb-2" />}
                <span className="font-bold">Check In</span>
                {isCheckedIn && <span className="text-xs mt-1">{history[0]?.in}</span>}
              </button>

              <button 
                onClick={handleCheckOut}
                disabled={!isCheckedIn || isCheckedOut}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                  !isCheckedIn || isCheckedOut
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-rose-500 text-white shadow-md hover:bg-rose-600 active:scale-95'
                }`}
              >
                {isCheckedOut ? <CheckCircle2 size={28} className="mb-2" /> : <Clock size={28} className="mb-2" />}
                <span className="font-bold">Check Out</span>
                {isCheckedOut && <span className="text-xs mt-1">{history[0]?.out}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="px-4 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Riwayat Kehadiran</h2>
            <button className={`text-sm font-bold ${t.primaryText}`}>Lihat Semua</button>
          </div>

          <div className="space-y-3">
            {history.map((record, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    record.status === 'Hadir' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {record.status === 'Hadir' ? <ClipboardCheck size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{record.date}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Status: <span className={record.status === 'Hadir' ? 'text-emerald-600' : 'text-amber-600'}>{record.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <span className="text-slate-400 text-xs font-normal">In:</span> {record.in}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mt-1">
                    <span className="text-slate-400 text-xs font-normal">Out:</span> {record.out}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
