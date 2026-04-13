import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Minus, User, BookOpen, Award, AlertCircle, Loader2, PieChart, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface RadialViewProps {
  t: any;
  onBack: () => void;
}

interface StudentData {
  nisn: string;
  name: string;
  kelas: string;
  waliKelas: string;
}

interface SubjectScore {
  subject: string;
  ganjil: number | null;
  genap: number | null;
}

export default function RadialView({ t, onBack }: RadialViewProps) {
  const [nisn, setNisn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(() => !!localStorage.getItem('savedNisn'));
  const [error, setError] = useState('');
  const [student, setStudent] = useState<StudentData | null>(null);
  const [scores, setScores] = useState<SubjectScore[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const SHEET_ID = '1xdSXU8QzMAKPTAXYEVGGJ1xt_78xUSc3wjFqAnos3bU';

  useEffect(() => {
    const savedNisn = localStorage.getItem('savedNisn');
    if (savedNisn) {
      setNisn(savedNisn);
      fetchStudentData(savedNisn).finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, []);

  const fetchStudentData = async (inputNisn: string) => {
    setIsLoading(true);
    setError('');

    const normalizedInputNisn = inputNisn.trim();

    const fetchGviz = async (gid: string, nisn: string) => {
      const tryFetch = async (q: string) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}&headers=1&tq=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        const text = await res.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(jsonString);
      };

      let data = await tryFetch(`select * where A = '${nisn}'`);
      if (data.status === 'error' || (data.table && data.table.rows.length === 0)) {
        if (/^\d+$/.test(nisn)) {
          const numData = await tryFetch(`select * where A = ${nisn}`);
          if (numData.status !== 'error' && numData.table && numData.table.rows.length > 0) {
            data = numData;
          } else if (numData.status !== 'error' && data.status === 'error') {
            data = numData;
          }
        }
      }
      return data;
    };

    const getCellVal = (row: any, colIdx: number) => {
      if (!row || !row.c || !row.c[colIdx]) return '';
      const cell = row.c[colIdx];
      if (cell === null || cell.v === null || cell.v === undefined) return '';
      return String(cell.f !== undefined ? cell.f : cell.v).trim();
    };

    try {
      // 1. Fetch Student
      const studentsData = await fetchGviz('0', normalizedInputNisn);

      if (!studentsData.table || !studentsData.table.rows || studentsData.table.rows.length === 0) {
        setError('NISN tidak ditemukan. Silakan periksa kembali.');
        setIsLoading(false);
        localStorage.removeItem('savedNisn');
        return;
      }

      const studentRow = studentsData.table.rows[0];
      const foundStudent: StudentData = {
        nisn: getCellVal(studentRow, 0),
        name: getCellVal(studentRow, 1) || 'Siswa Tanpa Nama',
        kelas: getCellVal(studentRow, 2) || '-',
        waliKelas: getCellVal(studentRow, 3) || '-'
      };

      setStudent(foundStudent);

      // 2. Fetch Ganjil & Genap in parallel
      const [ganjilData, genapData] = await Promise.all([
        fetchGviz('1670858955', normalizedInputNisn),
        fetchGviz('1263850975', normalizedInputNisn)
      ]);

      const ganjilRow = ganjilData.table?.rows?.[0];
      const genapRow = genapData.table?.rows?.[0];

      // Extract subjects (Col 3 to 17)
      const extractedScores: SubjectScore[] = [];
      const cols = ganjilData.table?.cols || genapData.table?.cols || [];

      for (let col = 3; col <= 17; col++) {
        const subjectName = cols[col]?.label?.trim();
        if (subjectName) {
          const gValStr = getCellVal(ganjilRow, col);
          const genValStr = getCellVal(genapRow, col);
          
          if (!gValStr && !genValStr) continue;

          const gVal = gValStr ? parseFloat(gValStr.replace(',', '.')) : null;
          const genVal = genValStr ? parseFloat(genValStr.replace(',', '.')) : null;
          
          extractedScores.push({
            subject: subjectName,
            ganjil: isNaN(gVal as number) ? null : gVal,
            genap: isNaN(genVal as number) ? null : genVal
          });
        }
      }

      setScores(extractedScores);
      localStorage.setItem('savedNisn', inputNisn);

    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat mengambil data. Pastikan koneksi internet stabil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim()) {
      setError('Masukkan NISN terlebih dahulu');
      return;
    }
    await fetchStudentData(nisn);
  };

  const handleLogout = () => {
    setStudent(null);
    setScores([]);
    setNisn('');
    localStorage.removeItem('savedNisn');
  };

  // Calculate stats
  const validGanjil = scores.filter(s => s.ganjil !== null).map(s => s.ganjil as number);
  const validGenap = scores.filter(s => s.genap !== null).map(s => s.genap as number);
  
  const avgGanjil = validGanjil.length ? (validGanjil.reduce((a, b) => a + b, 0) / validGanjil.length).toFixed(1) : '-';
  const avgGenap = validGenap.length ? (validGenap.reduce((a, b) => a + b, 0) / validGenap.length).toFixed(1) : '-';

  // Calculate progress only from subjects that have both scores for accurate comparison
  const subjectsWithBoth = scores.filter(s => s.ganjil !== null && s.genap !== null);
  let progress: string | null = null;
  if (subjectsWithBoth.length > 0) {
    const sumGanjil = subjectsWithBoth.reduce((sum, s) => sum + (s.ganjil as number), 0);
    const sumGenap = subjectsWithBoth.reduce((sum, s) => sum + (s.genap as number), 0);
    progress = ((sumGenap / subjectsWithBoth.length) - (sumGanjil / subjectsWithBoth.length)).toFixed(1);
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 relative">
      {/* Header */}
      <div className={`shrink-0 sticky top-0 z-40 px-4 py-4 flex items-center justify-between shadow-sm ${t.primaryBg} text-white`}>
        <div className="flex items-center gap-3">
          {(!student && !isInitializing) && (
            <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-lg font-bold">RADIAL (Rapor Digital)</h1>
        </div>
        {(student || isInitializing) && (
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={`p-2 mr-1 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white ${isInitializing ? 'opacity-50 pointer-events-none' : ''}`}
            title="Keluar"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi Keluar</h3>
            <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin keluar dari sesi rapor digital ini?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  setIsLoggingOut(true);
                  await new Promise(resolve => setTimeout(resolve, 800));
                  setIsLoggingOut(false);
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : null}
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full pb-20">
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          {isInitializing ? (
            <div className="flex justify-center items-center py-20">
              <div className={`w-8 h-8 border-4 border-t-transparent ${t.primaryText} rounded-full animate-spin border-opacity-50`}></div>
            </div>
          ) : !student ? (
            <motion.div 
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm max-w-md mx-auto mt-4 md:mt-8 relative overflow-hidden group`}
            >
              <div className={`absolute right-0 top-0 w-32 h-32 ${t.primaryBg} opacity-5 rounded-bl-full -z-0 transition-transform duration-500 group-hover:scale-125`}></div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto bg-gray-50 border border-gray-100">
                  <BookOpen size={32} className="text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Login Siswa</h3>
                <p className="text-center text-gray-500 text-sm mb-8">Masukkan NISN Anda untuk melihat nilai Sumatif Tengah Semester (STS).</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                    <div className="relative group">
                      {/* Base Border */}
                      <div className={`absolute inset-0 rounded-xl transition-colors duration-300 ${error ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                      
                      {/* Theme Border (Hover & Focus) */}
                      {!error && (
                        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 group-focus-within:opacity-100 transition-opacity duration-300 ${t.primaryBg}`}></div>
                      )}
                      
                      {/* Inner Background */}
                      <div className="absolute inset-[2px] bg-gray-50 group-focus-within:bg-white rounded-[10px] transition-colors duration-300"></div>
                      
                      {/* Icon */}
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <User size={18} className={`transition-colors duration-300 ${error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-gray-600'}`} />
                      </div>
                      
                      {/* Input */}
                      <input
                        type="text"
                        value={nisn}
                        onChange={(e) => {
                          setNisn(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Contoh: 3132070291"
                        className="relative w-full pl-10 pr-4 py-3 bg-transparent text-gray-800 placeholder-gray-400 !outline-none !border-none !ring-0 !shadow-none z-10"
                        style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {error}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full ${t.primaryBg} hover:opacity-90 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm`}
                  >
                    {isLoading ? (
                      <><Loader2 size={18} className="animate-spin" /> Memeriksa...</>
                    ) : (
                      <><Search size={18} /> Lihat Nilai</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="report-view"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              initial="hidden"
              animate="show"
              className="space-y-6 mt-4 md:mt-8"
            >
              {/* Student Info Card */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }} 
                style={{ willChange: "opacity, transform" }}
                className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                    <User size={24} className="text-teal-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-500">NISN: {student.nisn}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kelas</p>
                    <p className="font-medium text-gray-800">{student.kelas}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Wali Kelas</p>
                    <p className="font-medium text-gray-800">{student.waliKelas}</p>
                  </div>
                </div>
              </motion.div>

              {/* Grades Table */}
              <motion.div 
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }} 
                className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden`}
              >
                <div className="p-5 border-b border-gray-200 bg-white">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Award size={18} className="text-teal-600" />
                    Daftar Nilai Sumatif Tengah Semester (STS)
                  </h3>
                </div>
                <div className="overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`${t.primaryBg} text-white text-xs uppercase tracking-wider divide-x divide-white/20`}>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium border-b border-white/20">Mata Pelajaran</th>
                        <th className="px-2 sm:px-6 py-3 sm:py-4 font-medium border-b border-white/20 text-center w-16 sm:w-24">Ganjil</th>
                        <th className="px-2 sm:px-6 py-3 sm:py-4 font-medium border-b border-white/20 text-center w-24 sm:w-32">Genap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {scores.map((score, idx) => {
                        const diff = (score.genap !== null && score.ganjil !== null) ? score.genap - score.ganjil : null;
                        
                        return (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.03 }}
                            key={idx} 
                            className="hover:bg-gray-50 transition-colors divide-x divide-gray-200"
                          >
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-800">{score.subject}</td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center">
                              {score.ganjil !== null ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 text-gray-900 font-semibold">
                                  {score.ganjil}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                                {score.genap !== null ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-100 text-teal-900 font-bold">
                                    {score.genap}
                                  </span>
                                ) : (
                                  <span>-</span>
                                )}
                                
                                {diff !== null && (
                                  <div className="flex items-center justify-center">
                                    {diff > 0 ? (
                                      <span className="flex items-center text-teal-800 gap-0.5 text-[10px] sm:text-xs font-bold bg-teal-100 px-1.5 py-0.5 rounded-md">
                                        <TrendingUp size={12} /> +{diff}
                                      </span>
                                    ) : diff < 0 ? (
                                      <span className="flex items-center text-rose-700 gap-0.5 text-[10px] sm:text-xs font-bold bg-rose-100 px-1.5 py-0.5 rounded-md">
                                        <TrendingDown size={12} /> {diff}
                                      </span>
                                    ) : (
                                      <span className="flex items-center text-gray-700 gap-0.5 text-[10px] sm:text-xs font-semibold bg-gray-200 px-1.5 py-0.5 rounded-md">
                                        <Minus size={12} /> 0
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Statistics */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }} 
                style={{ willChange: "opacity, transform" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center relative overflow-hidden group`}>
                  <div className="absolute right-0 top-0 w-16 h-16 bg-gray-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                  <p className="text-sm text-gray-500 mb-1 relative z-10 font-medium">Rata-rata Ganjil</p>
                  <p className="text-3xl font-bold text-gray-800 relative z-10">{avgGanjil}</p>
                </div>
                <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center relative overflow-hidden group`}>
                  <div className="absolute right-0 top-0 w-16 h-16 bg-teal-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                  <p className="text-sm text-gray-500 mb-1 relative z-10 font-medium">Rata-rata Genap</p>
                  <p className="text-3xl font-bold text-teal-600 relative z-10">{avgGenap}</p>
                </div>
                <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center relative overflow-hidden group`}>
                  <div className={`absolute right-0 top-0 w-16 h-16 ${progress !== null && parseFloat(progress) < 0 ? 'bg-rose-50' : 'bg-blue-50'} rounded-bl-full -z-0 transition-transform group-hover:scale-110`}></div>
                  <p className="text-sm text-gray-500 mb-1 relative z-10 font-medium">Perkembangan</p>
                  <div className="flex items-center gap-2 relative z-10">
                    {progress !== null ? (
                      <>
                        <p className={`text-3xl font-bold ${parseFloat(progress) > 0 ? 'text-teal-600' : parseFloat(progress) < 0 ? 'text-rose-600' : 'text-gray-800'}`}>
                          {parseFloat(progress) > 0 ? '+' : ''}{progress}
                        </p>
                        {parseFloat(progress) > 0 ? (
                          <TrendingUp size={24} className="text-teal-600" />
                        ) : parseFloat(progress) < 0 ? (
                          <TrendingDown size={24} className="text-rose-600" />
                        ) : (
                          <Minus size={24} className="text-gray-400" />
                        )}
                      </>
                    ) : (
                      <p className="text-3xl font-bold text-gray-400">-</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
