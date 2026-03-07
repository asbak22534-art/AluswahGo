import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ThemeContext.Consumer>
          {(context) => {
            const t = context?.theme;
            if (!t) return null;
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center z-50">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${t.primaryLightBg} ${t.primaryText}`}>
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Halaman</h2>
                <p className="text-gray-600 mb-6 max-w-sm">
                  Terjadi kesalahan saat memuat komponen. Silakan periksa koneksi internet Anda dan coba lagi.
                </p>
                <button 
                  onClick={this.handleReload}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white ${t.primaryBg} active:scale-95 transition-transform`}
                >
                  <RefreshCw size={18} />
                  Coba Lagi
                </button>
              </div>
            );
          }}
        </ThemeContext.Consumer>
      );
    }

    return this.props.children;
  }
}
