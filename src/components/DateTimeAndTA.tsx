import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DateTimeAndTA({ tahunPelajaran = "TA 2023/2024 (Genap)" }: { tahunPelajaran?: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px] font-semibold text-white border border-white/20 w-fit shadow-sm">
        <Clock size={14} />
        <span className="tracking-wider">{formattedTime} WIB</span>
      </div>
      <div className="text-white/90 text-[11px] md:text-sm font-medium flex flex-wrap items-center gap-2">
        <span>{formattedDate}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
        <span>{tahunPelajaran}</span>
      </div>
    </div>
  );
}
