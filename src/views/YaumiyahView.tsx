import React from 'react';
import { ThemeConfig } from '../types';
import { ArrowLeft, CheckCheck } from 'lucide-react';

export function YaumiyahView({ t, onBack, title }: { t: ThemeConfig, onBack: () => void, title?: string }) {
  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <div className={`shrink-0 sticky top-0 z-40 px-4 py-4 flex items-center gap-3 shadow-sm ${t.primaryBg} text-white`}>
        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Mutaba'ah Yaumiyah</h1>
      </div>
      <div className="flex-1 w-full h-full">
        <iframe 
          src="https://script.google.com/macros/s/AKfycbyfS9W7SwAatehPbuQcJYj3T7ROEaRSd9wHrzaA5dgVN5l7zgkRp8LpMkDooaNcMh_C/exec" 
          className="w-full h-full border-0"
          title="Layanan Digital Yaumiyah"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
