import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ArrowLeft, Send, User } from 'lucide-react';
import { ThemeConfig } from '../types';
import ReactMarkdown from 'react-markdown';
import { SCRIPT_URL, useData } from '../context/DataContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

import { LazyImage } from '../components/LazyImage';

export function ChatbotView({ t, onBack }: { t: ThemeConfig, onBack: () => void }) {
  const { data } = useData();
  const chatbotAvatar = data?.profil?.['avatar_uswah'];
  const chatbotName = "Uswah";

  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substr(2, 9));
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Assalamu'alaikum Warahmatullahi Wabarakatuh Ayah/Bunda. Saya ${chatbotName}, asisten virtual MIS IT Al Uswah. Ada yang bisa saya bantu?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Uswah sedang membaca pesan...');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Ping GAS to wake it up from cold start
    fetch(`${SCRIPT_URL}?action=ping`).catch(() => {});
  }, []);

  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;
    
    if (isLoading) {
      setLoadingText('Uswah sedang membaca pesan...');
      timeout1 = setTimeout(() => {
        setLoadingText('Mencari informasi di database sekolah...');
      }, 2000);
      timeout2 = setTimeout(() => {
        setLoadingText('Menyusun jawaban untuk Anda...');
      }, 4500);
    }
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Ambil 5 pesan terakhir sebagai konteks percakapan
      const recentHistory = messages.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const submitData = new URLSearchParams();
      submitData.append('action', 'chatbot');
      submitData.append('message', userMessage.text);
      submitData.append('sessionId', sessionId);
      submitData.append('history', JSON.stringify(recentHistory));

      // Panggil Google Apps Script Web App
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: submitData.toString()
      });

      const responseData = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseData.reply || 'Maaf, Uswah tidak dapat merespons saat ini.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Maaf, terjadi kesalahan saat menghubungi server. Pastikan URL Web App sudah benar di kode.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 overflow-hidden relative z-50">
      {/* Header */}
      <header className={`px-4 py-3 flex items-center justify-between ${t.primaryBg} text-white shadow-md shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors lg:hidden">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 shrink-0">
              {chatbotAvatar ? (
                <LazyImage src={chatbotAvatar} alt={chatbotName} containerClassName="w-full h-full" className="w-full h-full object-cover" />
              ) : (
                <MessageCircle size={24} className={t.primaryText} />
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Uswah - Asisten Virtual</h2>
              <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 flex flex-col gap-4 pb-6 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? t.primaryBg : 'bg-white border border-gray-200 overflow-hidden shadow-sm'}`}
              >
                {msg.sender === 'user' ? (
                  <User size={20} className="text-white" />
                ) : chatbotAvatar ? (
                  <LazyImage src={chatbotAvatar} alt={chatbotName} containerClassName="w-full h-full" className="w-full h-full object-cover" />
                ) : (
                  <MessageCircle size={20} className={t.primaryText} />
                )}
              </div>
              <div 
                className={`p-4 rounded-2xl text-[15px] min-w-0 break-words shadow-sm ${
                  msg.sender === 'user' 
                    ? `${t.primaryBg} text-white rounded-tr-sm` 
                    : `bg-white border border-gray-100 text-gray-800 rounded-tl-sm`
                }`}
              >
                {msg.sender === 'bot' ? (
                  <div className="prose prose-sm md:prose-base max-w-none break-words">
                    <ReactMarkdown
                      components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className={`font-semibold hover:underline ${t.primaryText} break-all`} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="break-words">{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[90%] md:max-w-[80%] self-start">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {chatbotAvatar ? (
                  <LazyImage src={chatbotAvatar} alt={chatbotName} containerClassName="w-full h-full" className="w-full h-full object-cover" />
                ) : (
                  <MessageCircle size={20} className={t.primaryText} />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 self-start`}>
                  <div className={`w-2.5 h-2.5 rounded-full animate-bounce ${t.primaryBg}`}></div>
                  <div className={`w-2.5 h-2.5 rounded-full animate-bounce ${t.primaryBg}`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`w-2.5 h-2.5 rounded-full animate-bounce ${t.primaryBg}`} style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-[11px] text-gray-500 ml-1 animate-pulse">{loadingText}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1.5 pr-2 border border-gray-200 transition-all focus-within:ring-2 focus-within:ring-gray-200 shadow-inner">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ketik pesan untuk ${chatbotName}...`}
              className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2.5 text-[15px] text-gray-700"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-full transition-colors ${!input.trim() || isLoading ? 'bg-gray-200 text-gray-400' : `${t.primaryBg} text-white hover:opacity-90 shadow-md`}`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
