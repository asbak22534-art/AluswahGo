import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { ThemeConfig } from '../types';
import ReactMarkdown from 'react-markdown';
import { SCRIPT_URL } from '../context/DataContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function Chatbot({ t }: { t: ThemeConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substr(2, 9));
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Assalamu\'alaikum Warahmatullahi Wabarakatuh Ayah/Bunda. Saya Uswah, asisten virtual MIS IT Al Uswah. Ada yang bisa saya bantu?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || 'Maaf, Uswah tidak dapat merespons saat ini.',
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
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-8 z-50 p-4 rounded-full shadow-xl text-white flex items-center justify-center transition-opacity hover:opacity-90 ${t.primaryBg}`}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle size={28} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 md:bottom-24 right-4 md:right-8 z-50 w-[calc(100vw-2rem)] md:w-96 h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 text-white flex items-center justify-between shrink-0 bg-gradient-to-r ${t.gradient}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30">
                  <img src="https://i.postimg.cc/tJNc1kVh/Chat-Bot-Usw-ah.png" alt="Uswah" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Uswah</h3>
                  <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full transition-colors text-white hover:bg-black/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? t.primaryBg : 'bg-white border border-gray-200 overflow-hidden'}`}
                  >
                    {msg.sender === 'user' ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <img src="https://i.postimg.cc/tJNc1kVh/Chat-Bot-Usw-ah.png" alt="Uswah" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div 
                    className={`p-3 rounded-2xl text-sm min-w-0 break-words ${
                      msg.sender === 'user' 
                        ? `${t.primaryBg} text-white rounded-tr-sm` 
                        : `bg-gradient-to-br ${t.gradient} text-white rounded-tl-sm shadow-sm`
                    }`}
                  >
                    {msg.sender === 'bot' ? (
                      <div className="prose prose-sm max-w-none prose-invert break-words">
                        <ReactMarkdown
                          components={{
                            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-white opacity-90 break-all" />
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
                <div className="flex gap-2 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="https://i.postimg.cc/tJNc1kVh/Chat-Bot-Usw-ah.png" alt="Uswah" className="w-full h-full object-cover" />
                  </div>
                  <div className={`p-3 bg-gradient-to-br ${t.gradient} rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1`}>
                    <div className="w-2 h-2 rounded-full animate-bounce bg-white"></div>
                    <div className="w-2 h-2 rounded-full animate-bounce bg-white" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce bg-white" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1 pr-2 border border-gray-200 transition-all focus-within:ring-2 focus-within:ring-gray-200">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ketik pesan untuk Uswah..."
                  className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-sm text-gray-700"
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-full transition-colors ${!input.trim() || isLoading ? 'bg-gray-200 text-gray-400' : `${t.primaryBg} text-white hover:opacity-90`}`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
