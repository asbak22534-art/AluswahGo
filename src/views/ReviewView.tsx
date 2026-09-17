import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, Send, Loader2, MessageSquare, User, Users, GraduationCap, ImagePlus, X, CheckCircle2, Camera, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { fetchSheetJsonp, DEFAULT_SPREADSHEET_ID } from '../utils/googleSheets';

interface ReviewViewProps {
  t: any;
  onBack: () => void;
  title?: string;
}

interface Student {
  nama: string;
  kelas: string;
  tahun: string;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ t, onBack, title }) => {
  const { data } = useData();
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Form State
  const [role, setRole] = useState<'Alumni' | 'Wali Murid' | ''>('');
  const [namaWali, setNamaWali] = useState('');
  const [statusWali, setStatusWali] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [tahunLulus, setTahunLulus] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Photo State
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState('');
  const [isCompressingProfile, setIsCompressingProfile] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const SHEET_ID = DEFAULT_SPREADSHEET_ID;

  useEffect(() => {
    const API_URL = (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycby6a5GzCbHy8NjxOVF7OeGWogdLpEJlXarBDeiG_0BlHtoHDpmKbOEaIf1qzcbN2KpD/exec";
    if (API_URL.startsWith('https://script.google.com')) {
      // Kirim request ringan di background untuk membangunkan server (Cold Start Mitigation)
      fetch(`${API_URL}?action=ping`, { method: 'GET', mode: 'no-cors' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSheetJsonp(SHEET_ID, 'DB_SISWA');
        
        if (data && data.table && data.table.rows) {
          const parsedStudents: Student[] = [];
          const uniqueClasses = new Set<string>();
          const uniqueYears = new Set<string>();

          data.table.rows.forEach((row: any) => {
            if (!row.c) return;
            
            const nama = row.c[1]?.v ? String(row.c[1].v).trim() : '';
            const kelas = row.c[2]?.v ? String(row.c[2].v).trim() : '';
            const tahun = row.c[4]?.v ? String(row.c[4].v).trim() : '';
            
            if (nama && kelas && nama !== '' && kelas !== '' && kelas !== '-' && nama !== '-') {
              parsedStudents.push({ nama, kelas, tahun: tahun || '' });
              uniqueClasses.add(kelas);
              if (tahun && tahun !== '' && tahun !== '-') {
                uniqueYears.add(tahun);
              }
            }
          });

          setStudents(parsedStudents);
          setClasses(Array.from(uniqueClasses).filter(c => c && c.trim() !== '').sort());
          setYears(Array.from(uniqueYears).filter(y => y && y.trim() !== '').sort((a, b) => b.localeCompare(a)));
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  let availableClasses = classes;
  let availableStudents = students;

  if (role === 'Alumni') {
    if (tahunLulus) {
      availableStudents = students.filter(s => s.tahun === tahunLulus && s.kelas.includes('6'));
      availableClasses = Array.from(new Set(availableStudents.map(s => s.kelas))).sort();
    } else {
      availableClasses = [];
      availableStudents = [];
    }
  }

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentName = e.target.value;
    setSelectedStudent(studentName);
    
    // Check if this student has already been reviewed by this role
    if (data?.review && studentName) {
      const alreadyReviewed = data.review.some((r: any) => 
        r['Nama Siswa'] === studentName && r['Peran'] === role
      );
      
      setHasReviewed(alreadyReviewed);
      if (alreadyReviewed) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } else {
      setHasReviewed(false);
    }
  };

  const filteredStudents = availableStudents.filter(s => s.kelas === selectedClass).map(s => s.nama).sort();

  // Image Compression Logic
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 70% quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('File harus berupa gambar.');
        return;
      }
      
      setImageFile(file);
      setIsCompressing(true);
      setErrorMsg('');
      
      try {
        const compressedBase64 = await compressImage(file);
        // Send the full base64 string with prefix so backend can split it
        setImageBase64(compressedBase64);
      } catch (error) {
        console.error("Error compressing image", error);
        setErrorMsg("Gagal memproses gambar.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('File harus berupa gambar.');
        return;
      }
      
      setProfileImageFile(file);
      setIsCompressingProfile(true);
      setErrorMsg('');
      
      try {
        const compressedBase64 = await compressImage(file);
        setProfileImageBase64(compressedBase64);
      } catch (error) {
        console.error("Error compressing profile image", error);
        setErrorMsg("Gagal memproses foto profil.");
      } finally {
        setIsCompressingProfile(false);
      }
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImageBase64('');
    if (profileFileInputRef.current) {
      profileFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!profileImageBase64) {
      setErrorMsg("Mohon unggah Foto Profil Anda.");
      return;
    }

    if (role === 'Wali Murid') {
      if (!namaWali || !statusWali || !selectedClass || !selectedStudent || rating === 0 || !review.trim()) {
        setErrorMsg("Mohon lengkapi semua field yang wajib (*) dan berikan rating bintang.");
        return;
      }
    } else if (role === 'Alumni') {
      if (!selectedClass || !selectedStudent || !tahunLulus || rating === 0 || !review.trim()) {
        setErrorMsg("Mohon lengkapi semua field yang wajib (*) dan berikan rating bintang.");
        return;
      }
    }

    setIsSubmitting(true);
    
    // Construct Payload
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    // Create form data for Google Apps Script
    const formData = new URLSearchParams();
    formData.append('action', 'submitReview'); // CRITICAL: Added action parameter
    formData.append('Timestamp', timestamp);
    formData.append('Peran', role);
    formData.append('Nama Wali', role === 'Wali Murid' ? namaWali : "");
    formData.append('Status Wali', role === 'Wali Murid' ? statusWali : "");
    formData.append('Nama Siswa', selectedStudent);
    formData.append('Kelas', selectedClass);
    formData.append('Tahun Lulus', role === 'Alumni' ? tahunLulus : "");
    formData.append('Rating', rating.toString());
    formData.append('Testimoni', review);
    
    // Add profile image data
    formData.append('Foto', profileImageBase64);
    formData.append('imageFileName', profileImageFile ? profileImageFile.name : `profile_${Date.now()}.jpg`);
    
    // Add activity image data if exists
    if (imageBase64) {
      formData.append('Foto Kegiatan', imageBase64);
      formData.append('kegiatanImageFileName', imageFile ? imageFile.name : `kegiatan_${Date.now()}.jpg`);
    } else {
      formData.append('Foto Kegiatan', '');
    }

    try {
      // Use the Google Apps Script Web App URL from environment or fallback
      const API_URL = (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycby6a5GzCbHy8NjxOVF7OeGWogdLpEJlXarBDeiG_0BlHtoHDpmKbOEaIf1qzcbN2KpD/exec";
      
      // We use fetch with no-cors for Google Apps Script to avoid CORS issues
      // Note: with no-cors, we can't read the response, so we assume success if no error is thrown
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      setSubmitSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setRole('');
        setNamaWali('');
        setStatusWali('');
        setSelectedClass('');
        setSelectedStudent('');
        setTahunLulus('');
        setRating(0);
        setReview('');
        removeImage();
        removeProfileImage();
      }, 3000);

    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMsg("Terjadi kesalahan saat mengirim data. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 relative">
      {/* Header */}
      <div className={`shrink-0 sticky top-0 z-40 px-4 py-4 flex items-center gap-3 shadow-sm ${t.primaryBg} text-white`}>
        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Review & Testimoni</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full pb-20">
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
          
          {/* Header Title */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${t.primaryBg.replace('bg-', 'bg-').replace('600', '100')} border ${t.primaryBg.replace('bg-', 'border-').replace('600', '200')}`}>
              <MessageSquare size={32} className={t.primaryBg.replace('bg-', 'text-')} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title || "Beri Ulasan Anda"}</h2>
            <p className="text-gray-500 text-sm">Masukan Anda sangat berarti bagi perkembangan sekolah kami.</p>
          </div>

          <AnimatePresence mode="wait">
            {!role ? (
              /* ROLE SELECTION CARDS */
              <motion.div 
                key="role-selection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div 
                  onClick={() => setRole('Alumni')}
                  className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group text-center ${t.primaryBg.replace('bg-', 'hover:border-')}`}
                >
                  <div className={`w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${t.primaryBg.replace('bg-', 'group-hover:bg-').replace('600', '50')}`}>
                    <GraduationCap className={`w-10 h-10 text-gray-400 transition-colors ${t.primaryBg.replace('bg-', 'group-hover:text-')}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Alumni</h3>
                  <p className="text-sm text-gray-500">Saya adalah lulusan dari sekolah ini.</p>
                </div>

                <div 
                  onClick={() => setRole('Wali Murid')}
                  className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group text-center ${t.primaryBg.replace('bg-', 'hover:border-')}`}
                >
                  <div className={`w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${t.primaryBg.replace('bg-', 'group-hover:bg-').replace('600', '50')}`}>
                    <Users className={`w-10 h-10 text-gray-400 transition-colors ${t.primaryBg.replace('bg-', 'group-hover:text-')}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Wali Murid</h3>
                  <p className="text-sm text-gray-500">Saya adalah orang tua/wali dari siswa.</p>
                </div>
              </motion.div>
            ) : submitSuccess ? (
              /* SUCCESS MODAL */
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h3>
                <p className="text-gray-500 mb-6">Ulasan Anda telah berhasil dikirim dan akan segera kami tinjau.</p>
              </motion.div>
            ) : (
              /* FORM CONTAINER (Fade-in Slide-up) */
              <motion.div 
                key="form-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MessageSquare size={20} className={t.primaryBg.replace('bg-', 'text-')} />
                    Form Ulasan {role}
                  </h2>
                  <button 
                    onClick={() => setRole('')} 
                    className={`text-sm text-gray-500 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 ${t.primaryBg.replace('bg-', 'hover:text-')}`}
                  >
                    <ArrowLeft size={16} /> Kembali
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* TOP SECTION: PROFILE PHOTO & SPECIFIC FIELDS */}
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* PROFILE PHOTO UPLOAD */}
                    <div className="w-full sm:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Foto Profil <span className="text-red-500">*</span></label>
                      <p className="text-xs text-gray-500 mb-2">Foto akan ditampilkan di ulasan.</p>
                      
                      {!profileImageBase64 ? (
                        <div 
                          onClick={() => profileFileInputRef.current?.click()}
                          className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 ${t.primaryBg.replace('bg-', 'hover:border-').replace('600', '400')}`}
                        >
                          {isCompressingProfile ? (
                            <Loader2 size={24} className={`animate-spin ${t.primaryBg.replace('bg-', 'text-')}`} />
                          ) : (
                            <>
                              <Camera size={24} className="text-gray-400 mb-2" />
                              <span className="text-sm text-gray-500">Pilih Foto</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="relative inline-block w-full text-center">
                          <img 
                            src={profileImageBase64} 
                            alt="Profile Preview" 
                            className="h-32 w-32 mx-auto rounded-full border border-gray-200 object-cover shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={removeProfileImage}
                            className="absolute top-0 right-1/4 translate-x-4 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={profileFileInputRef}
                        onChange={handleProfileFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="w-full sm:w-2/3 space-y-6">
                      {/* WALI MURID SPECIFIC FIELDS */}
                      {role === 'Wali Murid' && (
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wali <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              value={namaWali}
                              onChange={(e) => setNamaWali(e.target.value)}
                              placeholder="Nama Lengkap Anda" 
                              className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition-all bg-gray-50 focus:bg-white focus:ring-2 ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/30')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status Wali <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="radio" 
                                  name="statusWali" 
                                  value="Ayah" 
                                  checked={statusWali === 'Ayah'}
                                  onChange={(e) => setStatusWali(e.target.value)}
                                  className={`w-4 h-4 border-gray-300 ${t.primaryBg.replace('bg-', 'text-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')}`}
                                />
                                <span className={`text-gray-700 transition-colors ${t.primaryBg.replace('bg-', 'group-hover:text-')}`}>Ayah</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="radio" 
                                  name="statusWali" 
                                  value="Bunda" 
                                  checked={statusWali === 'Bunda'}
                                  onChange={(e) => setStatusWali(e.target.value)}
                                  className={`w-4 h-4 border-gray-300 ${t.primaryBg.replace('bg-', 'text-').replace('600', '500')} ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500')}`}
                                />
                                <span className={`text-gray-700 transition-colors ${t.primaryBg.replace('bg-', 'group-hover:text-')}`}>Bunda</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ALUMNI SPECIFIC FIELDS - TAHUN LULUS */}
                      {role === 'Alumni' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Lulus <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <GraduationCap size={18} className="text-gray-400" />
                            </div>
                            <select
                              value={tahunLulus}
                              onChange={(e) => {
                                setTahunLulus(e.target.value);
                                setSelectedClass('');
                                setSelectedStudent('');
                              }}
                              disabled={isLoadingData}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none transition-all appearance-none bg-gray-50 focus:bg-white focus:ring-2 ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/30')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`}
                            >
                              <option value="" disabled>Pilih Tahun Lulus</option>
                              {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SHARED / DYNAMIC FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {role === 'Alumni' ? 'Kelas Terakhir' : 'Kelas'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users size={18} className="text-gray-400" />
                        </div>
                        <select
                          value={selectedClass}
                          onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setSelectedStudent('');
                          }}
                          disabled={isLoadingData || (role === 'Alumni' && !tahunLulus)}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none transition-all appearance-none ${role === 'Alumni' && !tahunLulus ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'} focus:ring-2 ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/30')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`}
                        >
                          <option value="" disabled>Pilih Kelas</option>
                          {availableClasses.filter(c => c && c.trim() !== '').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {isLoadingData && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {role === 'Alumni' ? 'Nama Anda' : 'Nama Siswa'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={18} className="text-gray-400" />
                        </div>
                        <select
                          value={selectedStudent}
                          onChange={handleStudentChange}
                          disabled={!selectedClass || isLoadingData}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none transition-all appearance-none ${!selectedClass ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'} focus:ring-2 ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/30')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`}
                        >
                          <option value="" disabled>Pilih Nama</option>
                          {filteredStudents.filter(s => s && s.trim() !== '').map((s, idx) => (
                            <option key={`${s}-${idx}`} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* RATING UI */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Penilaian Anda <span className="text-red-500">*</span></label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={hasReviewed}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`p-1 transition-transform ${hasReviewed ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 focus:outline-none'}`}
                        >
                          <Star 
                            size={40} 
                            className={`transition-colors duration-200 ${
                              (hoverRating || rating) >= star 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                    <div className="text-center text-sm font-medium text-gray-500 mt-2 h-5">
                      {(hoverRating || rating) === 1 && 'Sangat Kurang'}
                      {(hoverRating || rating) === 2 && 'Kurang'}
                      {(hoverRating || rating) === 3 && 'Cukup'}
                      {(hoverRating || rating) === 4 && 'Baik'}
                      {(hoverRating || rating) === 5 && 'Sangat Baik'}
                    </div>
                  </div>

                  {/* TESTIMONI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pesan / Testimoni <span className="text-red-500">*</span></label>
                    <textarea 
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      disabled={hasReviewed}
                      rows={4} 
                      placeholder={hasReviewed ? "Anda sudah mengirim ulasan untuk nama ini." : "Ceritakan pengalaman Anda..."} 
                      className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition-all ${hasReviewed ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:bg-white focus:ring-2'} resize-none ${t.primaryBg.replace('bg-', 'focus:ring-').replace('600', '500/30')} ${t.primaryBg.replace('bg-', 'focus:border-').replace('600', '500')}`}
                    ></textarea>
                  </div>

                  {/* IMAGE UPLOAD */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lampirkan Foto Kegiatan (Opsional)</label>
                    <p className="text-xs text-gray-500 mb-2">Foto akan dikompres otomatis sebelum diunggah.</p>
                    
                    {!imageBase64 ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 ${t.primaryBg.replace('bg-', 'hover:border-').replace('600', '400')}`}
                      >
                        {isCompressing ? (
                          <div className="flex flex-col items-center text-gray-500">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <span className="text-sm font-medium">Memproses gambar...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-500">
                            <ImagePlus size={32} className="mb-2 text-gray-400" />
                            <span className="text-sm font-medium">Klik untuk memilih foto</span>
                            <span className="text-xs mt-1">JPG, PNG, atau WEBP</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          disabled={isCompressing}
                        />
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img 
                          src={imageBase64} 
                          alt="Preview" 
                          className="h-32 w-auto rounded-lg border border-gray-200 object-cover shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ERROR MESSAGE */}
                  {errorMsg && (
                    <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg font-medium">
                      {errorMsg}
                    </div>
                  )}

                  {/* SUBMIT BUTTON */}
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isCompressing || hasReviewed}
                    className={`w-full py-4 ${t.primaryBg} text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${hasReviewed ? 'opacity-50' : ''}`}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={20} className="animate-spin" /> Mengirim...</>
                    ) : (
                      <><Send size={20} /> Kirim Ulasan</>
                    )}
                  </button>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 w-[90%] max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-400" />
            </div>
            <p className="text-sm font-medium">Anda telah mengirim pesan review untuk nama ini.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
