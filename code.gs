function doPost(e) {
  try {
    // 1. CEK APAKAH INI REQUEST DARI FORM KRITIK & SARAN
    if (e.parameter && e.parameter.action === 'submitKritik') {
      return handleSubmitKritik(e);
    }

    // 1.5 CEK APAKAH INI REQUEST DARI CHATBOT
    if (e.parameter && e.parameter.action === 'chatbot') {
      return handleChatbot({
        message: e.parameter.message,
        sessionId: e.parameter.sessionId,
        history: e.parameter.history
      });
    }

    // 2. CEK APAKAH INI REQUEST DARI FORM SPMB (tidak ada parameter action, tapi ada nama_lengkap)
    if (e.parameter && e.parameter.nama_lengkap) {
      return handleSubmitSPMB(e);
    }

    // 3. JIKA BUKAN FORM, ASUMSIKAN INI REQUEST JSON DARI CHATBOT USWAH
    if (e.postData && e.postData.contents) {
      let requestData;
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (err) {
        // Bukan JSON, mungkin form url-encoded yang tidak tertangkap di atas
      }

      if (requestData && requestData.message) {
        return handleChatbot(requestData);
      }
    }

    // Jika format request tidak dikenali
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Request tidak valid atau kosong'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleChatbot(requestData) {
  const userMessage = requestData.message;
  const sessionId = requestData.sessionId || generateSessionId();

  const cache = CacheService.getScriptCache();
  // Menggunakan v3 agar merefresh memori cache lama yang mungkin error
  let systemPrompt = cache.get("chatbot_systemPrompt_v3");
  let apiKey = cache.get("chatbot_apiKey_v3");
  let contextString = cache.get("chatbot_contextString_v3");

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!systemPrompt || !apiKey || !contextString) {
    // Cek apakah sheet Pengaturan ada
    const sheetPengaturan = ss.getSheetByName("Pengaturan");
    if (!sheetPengaturan) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", reply: "Maaf, database Pengaturan belum dibuat. Jalankan initializeSheets() terlebih dahulu.", sessionId: sessionId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const dataPengaturan = sheetPengaturan.getDataRange().getValues();
    systemPrompt = "";
    apiKey = "";
    let linkWa = "";

    for (let i = 1; i < dataPengaturan.length; i++) {
      const key = dataPengaturan[i][0];
      const value = dataPengaturan[i][1];
      if (key === "System_Prompt") systemPrompt = value;
      if (key === "Gemini_API_Key") apiKey = value;
      if (key === "Link_WA_Admin") linkWa = value;
    }

    // Ganti placeholder [LINK_WA_ADMIN] dengan link asli
    systemPrompt = systemPrompt.replace("[LINK_WA_ADMIN]", linkWa);

    // Ambil Knowledge Base
    const sheetKB = ss.getSheetByName("KnowledgeBase");
    if (sheetKB) {
      const dataKB = sheetKB.getDataRange().getValues();
      contextString = "INFORMASI SEKOLAH (KNOWLEDGE BASE):\n";
      for (let i = 1; i < dataKB.length; i++) {
        const kategori = dataKB[i][0];
        const kataKunci = dataKB[i][1];
        const info = dataKB[i][2];
        contextString += `- [${kategori}] (${kataKunci}): ${info}\n`;
      }
    } else {
      contextString = "Informasi sekolah belum tersedia.";
    }

    // Simpan ke cache selama 6 jam (21600 detik)
    cache.put("chatbot_systemPrompt_v3", systemPrompt, 21600);
    cache.put("chatbot_apiKey_v3", apiKey, 21600);
    cache.put("chatbot_contextString_v3", contextString, 21600);
  }

  // Validasi API Key
  if (!apiKey || apiKey === "MASUKKAN_API_KEY_DISINI") {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success", reply: "Maaf, sistem Uswah belum dikonfigurasi dengan baik. Mohon Admin memasukkan API Key Gemini di Sheet Pengaturan.", sessionId: sessionId
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Panggil Gemini API (gemini-1.5-flash)
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  let history = [];
  try {
    if (requestData.history) {
      history = JSON.parse(requestData.history);
    }
  } catch (e) {
    console.error("Gagal parse history:", e);
  }

  const contents = [...history, {
    "role": "user",
    "parts": [{ "text": userMessage }]
  }];

  const payload = {
    "system_instruction": {
      "parts": [{ "text": systemPrompt + "\n\n" + contextString }]
    },
    "contents": contents,
    "generationConfig": {
      "temperature": 0.3, // Suhu rendah agar jawaban lebih faktual sesuai konteks
      "maxOutputTokens": 250
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(geminiUrl, options);
  const responseJson = JSON.parse(response.getContentText());
  
  let botReply = "Maaf, Uswah sedang mengalami gangguan sistem. Silakan hubungi admin.";
  
  if (responseJson.candidates && responseJson.candidates.length > 0) {
    botReply = responseJson.candidates[0].content.parts[0].text;
  } else {
    console.error("Gemini API Error:", response.getContentText());
  }

  // Simpan histori ke Log_Chat secara aman
  try {
    const sheetLog = ss.getSheetByName("Log_Chat");
    if (sheetLog) {
      const timestamp = new Date();
      sheetLog.appendRow([timestamp, sessionId, userMessage, botReply]);
    }
  } catch (e) {
    console.error("Gagal menyimpan log:", e);
  }

  // Kembalikan response JSON ke frontend
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    reply: botReply,
    sessionId: sessionId
  })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = e.parameter.action;
    
    if (!action) {
      // Return all data if no specific action is requested
      const result = {
        header: getKeyValueData(ss, "Header"),
        sambutan: getKeyValueData(ss, "Sambutan"),
        profil: getKeyValueData(ss, "Profil"),
        doa: getSheetData(ss, "Doa"),
        dzikir: getSheetData(ss, "Dzikir"),
        kalender: getSheetData(ss, "Kalender"),
        program: getSheetData(ss, "Program"),
        ekstra: getSheetData(ss, "Ekstra"),
        sarpras: getSheetData(ss, "Sarpras"),
        galeri: getSheetData(ss, "Galeri"),
        notifikasi: getSheetData(ss, "Notifikasi"),
        pengumuman: getSheetData(ss, "Pengumuman"),
        review: getSheetData(ss, "Review"),
        video: getSheetData(ss, "Video"),
        footer: getKeyValueData(ss, "Footer")
      };
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle specific actions if needed
    let data = [];
    switch (action) {
      case "checkTapel":
        return ContentService.createTextOutput(JSON.stringify({
          status: "Buka"
        })).setMimeType(ContentService.MimeType.JSON);
        
      case "validate":
        const nama = e.parameter.nama;
        const tgl = e.parameter.tgl;
        const sheetSPMB = ss.getSheetByName('Pendaftar_SPMB');
        if (sheetSPMB) {
          const dataSPMB = sheetSPMB.getDataRange().getValues();
          for (let i = 1; i < dataSPMB.length; i++) {
            if (dataSPMB[i][2] === nama && dataSPMB[i][5] === tgl) {
              return ContentService.createTextOutput(JSON.stringify({
                status: "duplicate"
              })).setMimeType(ContentService.MimeType.JSON);
            }
          }
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: "ok"
        })).setMimeType(ContentService.MimeType.JSON);
        
      case "check":
        const token = e.parameter.token;
        const sheetCheck = ss.getSheetByName('Pendaftar_SPMB');
        if (sheetCheck) {
          const dataCheck = sheetCheck.getDataRange().getValues();
          for (let i = 1; i < dataCheck.length; i++) {
            if (dataCheck[i][1] === token) {
              return ContentService.createTextOutput(JSON.stringify({
                status: "found",
                data: {
                  nama_lengkap: dataCheck[i][2],
                  tgl_lahir: dataCheck[i][5],
                  tapel: dataCheck[i][6],
                  asal_sekolah: dataCheck[i][7]
                }
              })).setMimeType(ContentService.MimeType.JSON);
            }
          }
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: "not_found"
        })).setMimeType(ContentService.MimeType.JSON);

      case "getHomeData":
        data = {
          header: getKeyValueData(ss, "Header"),
          sambutan: getKeyValueData(ss, "Sambutan"),
          profil: getKeyValueData(ss, "Profil"),
          notifikasi: getSheetData(ss, "Notifikasi"),
          pengumuman: getSheetData(ss, "Pengumuman"),
          footer: getKeyValueData(ss, "Footer")
        };
        break;
      case "getSecondaryData":
        data = {
          doa: getSheetData(ss, "Doa"),
          dzikir: getSheetData(ss, "Dzikir"),
          kalender: getSheetData(ss, "Kalender"),
          program: getSheetData(ss, "Program"),
          ekstra: getSheetData(ss, "Ekstra"),
          sarpras: getSheetData(ss, "Sarpras"),
          galeri: getSheetData(ss, "Galeri"),
          review: getSheetData(ss, "Review"),
          video: getSheetData(ss, "Video")
        };
        break;
      case "getProfil":
        data = getKeyValueData(ss, "Profil");
        break;
      case "getDoa":
        data = getSheetData(ss, "Doa");
        break;
      case "getDzikir":
        data = getSheetData(ss, "Dzikir");
        break;
      case "getKalender":
        data = getSheetData(ss, "Kalender");
        break;
      case "getProgram":
        data = getSheetData(ss, "Program");
        break;
      case "getEkstra":
        data = getSheetData(ss, "Ekstra");
        break;
      case "getSarpras":
        data = getSheetData(ss, "Sarpras");
        break;
      case "getGaleri":
        data = getSheetData(ss, "Galeri");
        break;
      case "getNotifikasi":
        data = getSheetData(ss, "Notifikasi");
        break;
      case "getPengumuman":
        data = getSheetData(ss, "Pengumuman");
        break;
      case "getHeader":
        data = getKeyValueData(ss, "Header");
        break;
      case "getSambutan":
        data = getKeyValueData(ss, "Sambutan");
        break;
      case "getReview":
        data = getSheetData(ss, "Review");
        break;
      case "getVideo":
        data = getSheetData(ss, "Video");
        break;
      case "getFooter":
        data = getKeyValueData(ss, "Footer");
        break;
      default:
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Action tidak valid"
        })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: data
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize Kritik sheet
  initializeKritikSheet();
  
  // Initialize SPMB sheet
  initializeSPMBSheet();
  
  const sheetsConfig = [
    {
      name: "Header",
      headers: ["key", "value"],
      initialData: [
        ["logo", "https://i.ibb.co.com/ZzR8XbXy/logo.png"],
        ["judul", "MIS IT Al Uswah"],
        ["sub_judul", "Sekolah Dasar Islam"]
      ]
    },
    {
      name: "Sambutan",
      headers: ["key", "value"],
      initialData: [
        ["tahun_pelajaran", "Tahun Pelajaran 2024/2025"],
        ["kalimat_sambutan", "Selamat datang, Ayah Bunda"],
        ["highlight_text", "Ayah Bunda"],
        ["highlight_color", "#fcd34d"],
        ["caption", "di Portal Digital MIS Islam Terpadu Al Uswah."]
      ]
    },
    {
      name: "Profil",
      headers: ["key", "value"],
      initialData: [
        ["nama_sekolah", "MIS Islam Terpadu Al Uswah"],
        ["caption", "Membentuk Generasi Qur'ani, Mandiri dan Berprestasi"],
        ["visi", "Terwujudnya generasi Qur'ani, Mandiri dan Berprestasi"],
        ["alamat", "Jl. Tegir, RT 01/ RW 01, Kecamatan Pasirian, Kabupaten Lumajang, Jawa Timur 67372"],
        ["jumlah_guru", "25"],
        ["siswa_aktif", "350"],
        ["alumni", "1200+"],
        ["jumlah_program", "5"],
        ["jumlah_ekskul", "8"],
        ["wa", "6282333427597"],
        ["website", "https://www.misitaluswah.sch.id/"],
        ["fb", "https://www.facebook.com/misitaluswah1"],
        ["ig", "https://www.instagram.com/misitaluswah/"],
        ["yt", "https://www.youtube.com/@misitaluswah"],
        ["tiktok", "https://www.tiktok.com/@misitaluswah"],
        ["link_radial", "https://ai.studio/apps/0eda68f0-023c-4889-a38a-2a21d26e60af"]
      ]
    },
    {
      name: "Doa",
      headers: ["judul", "kategori", "arab", "latin", "arti"]
    },
    {
      name: "Dzikir",
      headers: ["tipe", "arab", "latin", "arti"]
    },
    {
      name: "Kalender",
      headers: ["tanggal", "kegiatan", "is_libur"]
    },
    {
      name: "Program",
      headers: ["nama", "deskripsi", "gambar"]
    },
    {
      name: "Ekstra",
      headers: ["nama", "deskripsi", "gambar"]
    },
    {
      name: "Sarpras",
      headers: ["nama", "deskripsi", "gambar"]
    },
    {
      name: "Galeri",
      headers: ["nama", "gambar"]
    },
    {
      name: "Notifikasi",
      headers: ["id", "type", "title", "desc", "fullDesc", "time", "image"]
    },
    {
      name: "Pengumuman",
      headers: ["teks", "aktif"],
      initialData: [
        ["Selamat Datang di Portal Digital MIS IT Al Uswah. Pendaftaran Siswa Baru Tahun Ajaran 2024/2025 telah dibuka!", "TRUE"]
      ]
    },
    {
      name: "Review",
      headers: ["nama", "peran", "komentar", "rating", "foto"],
      initialData: [
        ["Bapak Fulan", "Wali Murid Kelas 1", "Alhamdulillah, anak saya semakin rajin sholat dan mengaji sejak bersekolah di sini.", "5", "https://picsum.photos/seed/user1/100/100"],
        ["Ibu Fulanah", "Wali Murid Kelas 3", "Fasilitas sekolah sangat mendukung perkembangan anak.", "5", "https://picsum.photos/seed/user2/100/100"]
      ]
    },
    {
      name: "Video",
      headers: ["judul", "url_youtube", "thumbnail"],
      initialData: [
        ["Profil MIS IT Al Uswah", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://picsum.photos/seed/video1/400/300"]
      ]
    },
    {
      name: "Footer",
      headers: ["key", "value"],
      initialData: [
        ["teks_cta", "Mari bergabung bersama kami mencetak generasi Qur'ani, Mandiri, dan Berprestasi!"],
        ["no_wa", "6282333427597"],
        ["pesan_wa", "Halo Admin MIS IT Al Uswah, saya ingin bertanya informasi pendaftaran siswa baru."],
        ["facebook", "https://www.facebook.com/misitaluswah1"],
        ["instagram", "https://www.instagram.com/misitaluswah/"],
        ["youtube", "https://www.youtube.com/@misitaluswah"],
        ["alamat", "Jl. Tegir, RT 01/ RW 01, Kecamatan Pasirian, Kabupaten Lumajang, Jawa Timur 67372"]
      ]
    }
  ];

  sheetsConfig.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      // Format headers
      sheet.getRange(1, 1, 1, config.headers.length).setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
      
      if (config.initialData) {
        sheet.getRange(2, 1, config.initialData.length, config.initialData[0].length).setValues(config.initialData);
      }
    }
  });

  return "Inisialisasi berhasil! Sheet telah dibuat.";
}

// Helper function to get data as array of objects
function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Empty or only headers
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  
  return result;
}

// Helper function to get key-value data (for Profil)
function getKeyValueData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};
  
  const result = {};
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key) {
      result[key] = value;
    }
  }
  
  return result;
}

function handleSubmitKritik(e) {
  const sheetName = 'Kritik_App';
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = initializeKritikSheet();
  }
  
  const timestamp = e.parameter.timestamp || new Date().toLocaleString('id-ID');
  const nama = e.parameter.nama || 'Anonim';
  const kelas = e.parameter.kelas || '-';
  const jenis = e.parameter.jenis || 'Kritik';
  const pesan = e.parameter.pesan || '';
  
  let kritik = '';
  let saran = '';
  
  if (jenis === 'Kritik') {
    kritik = pesan;
  } else if (jenis === 'Saran') {
    saran = pesan;
  }
  
  sheet.appendRow([
    timestamp,
    nama,
    kelas,
    jenis,
    kritik,
    saran
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Kritik dan saran berhasil dikirim'
  })).setMimeType(ContentService.MimeType.JSON);
}

function initializeKritikSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Kritik_App');
  
  if (!sheet) {
    sheet = ss.insertSheet('Kritik_App');
    
    const headers = [
      'Timestamp',
      'Nama Lengkap',
      'Kelas Anak',
      'Jenis Pesan',
      'Kritik',
      'Saran'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
    
    // Set column widths
    sheet.setColumnWidth(1, 150); // Timestamp
    sheet.setColumnWidth(2, 200); // Nama
    sheet.setColumnWidth(3, 100); // Kelas
    sheet.setColumnWidth(4, 120); // Jenis Pesan
    sheet.setColumnWidth(5, 300); // Kritik
    sheet.setColumnWidth(6, 300); // Saran
  }
  
  return sheet;
}

function handleSubmitSPMB(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Pendaftar_SPMB');
  if (!sheet) {
    sheet = initializeSPMBSheet();
  }
  
  // Generate Token
  const token = "REG25-" + Math.random().toString(36).substr(2, 5).toUpperCase();
  
  const rowData = [
    e.parameter.timestamp || new Date().toLocaleString('id-ID'),
    token,
    e.parameter.nama_lengkap || '',
    e.parameter.nama_panggilan || '',
    e.parameter.jenis_kelamin || '',
    e.parameter.tgl_lahir || '',
    e.parameter.tapel || '',
    e.parameter.asal_sekolah || '',
    e.parameter.nama_ayah || '',
    e.parameter.pekerjaan_ayah || '',
    e.parameter.nama_ibu || '',
    e.parameter.pekerjaan_ibu || '',
    e.parameter.alamat_rt || '',
    e.parameter.alamat_rw || '',
    e.parameter.alamat_desa || '',
    e.parameter.alamat_kecamatan || '',
    e.parameter.alamat_kabupaten || '',
    e.parameter.nomor_hp || '',
    e.parameter.sumber_info_check || ''
  ];
  
  sheet.appendRow(rowData);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    token: token,
    message: 'Pendaftaran berhasil'
  })).setMimeType(ContentService.MimeType.JSON);
}

function initializeSPMBSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Pendaftar_SPMB');
  if (!sheet) {
    sheet = ss.insertSheet('Pendaftar_SPMB');
    const headers = [
      'Timestamp', 'Token', 'Nama Lengkap', 'Nama Panggilan', 'Jenis Kelamin', 
      'Tanggal Lahir', 'Tahun Pelajaran', 'Asal Sekolah', 'Nama Ayah', 
      'Pekerjaan Ayah', 'Nama Ibu', 'Pekerjaan Ibu', 'RT', 'RW', 
      'Desa', 'Kecamatan', 'Kabupaten', 'Nomor HP', 'Sumber Info'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Fungsi bantuan untuk membuat ID Sesi acak
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substr(2, 9);
}
