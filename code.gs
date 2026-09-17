function doPost(e) {
  try {
    // 1. CEK APAKAH INI REQUEST DARI FORM KRITIK & SARAN
    if (e.parameter && e.parameter.action === 'submitKritik') {
      return handleSubmitKritik(e);
    }

    // 1.2 CEK APAKAH INI REQUEST DARI FORM REVIEW
    if (e.parameter && e.parameter.action === 'submitReview') {
      return handleSubmitReview(e);
    }

    // 1.5 CEK APAKAH INI REQUEST DARI CHATBOT
    if (e.parameter && e.parameter.action === 'chatbot') {
      return handleChatbot({
        message: e.parameter.message,
        sessionId: e.parameter.sessionId,
        history: e.parameter.history
      });
    }

    // 2. CEK APAKAH INI REQUEST UNTUK UPDATE DATA SPMB (Correction Mode)
    if (e.parameter && e.parameter.action === 'updateSPMB') {
      return handleUpdateSPMB(e);
    }

    // 2. CEK APAKAH INI REQUEST DARI FORM SPMB (tidak ada parameter action, tapi ada nama_lengkap)
    if (e.parameter && e.parameter.nama_lengkap) {
      return handleSubmitSPMB(e);
    }

    // 3. JIKA BUKAN FORM, ASUMSIKAN INI REQUEST JSON DARI CHATBOT USWAH ATAU YAUMIYAH
    if (e.postData && e.postData.contents) {
      let requestData;
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (err) {
        // Bukan JSON, mungkin form url-encoded yang tidak tertangkap di atas
      }

      if (requestData) {
        if (requestData.action === 'checkAdminPassword') {
          return ContentService.createTextOutput(JSON.stringify({success: checkAdminPassword(requestData.password)})).setMimeType(ContentService.MimeType.JSON);
        }
        if (requestData.action === 'simpanLaporan') {
          return ContentService.createTextOutput(JSON.stringify(simpanLaporan(requestData))).setMimeType(ContentService.MimeType.JSON);
        }
        if (requestData.action === 'uploadFile') {
          return ContentService.createTextOutput(JSON.stringify(uploadFile(requestData.data, requestData.fileName, requestData.teacherName, requestData.bulan, requestData.pekan))).setMimeType(ContentService.MimeType.JSON);
        }
        if (requestData.message) {
          return handleChatbot(requestData);
        }
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
  // Menggunakan v4 agar merefresh memori cache lama dan memuat link wa_admin terbaru dari Profil!B22
  let systemPrompt = cache.get("chatbot_systemPrompt_v4");
  let apiKey = cache.get("chatbot_apiKey_v4");
  let contextString = cache.get("chatbot_contextString_v4");

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

    // Ambil Link WA Admin dari sheet Profil (key: wa_admin / cell B22) sebagai prioritas utama
    const sheetProfil = ss.getSheetByName("Profil");
    if (sheetProfil) {
      const dataProfil = sheetProfil.getDataRange().getValues();
      for (let i = 1; i < dataProfil.length; i++) {
        if (dataProfil[i][0] === "wa_admin" && dataProfil[i][1]) {
          linkWa = dataProfil[i][1];
          break;
        }
      }
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

    // Simpan ke cache selama 6 jam (21600 detik) - versi 4 untuk memuat link terbaru dari Profil!B22
    cache.put("chatbot_systemPrompt_v4", systemPrompt, 21600);
    cache.put("chatbot_apiKey_v4", apiKey, 21600);
    cache.put("chatbot_contextString_v4", contextString, 21600);
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
      case "getDataGuru":
        return ContentService.createTextOutput(JSON.stringify(getDataGuru())).setMimeType(ContentService.MimeType.JSON);
      case "getAllLaporan":
        return ContentService.createTextOutput(JSON.stringify({success: true, data: getAllLaporan()})).setMimeType(ContentService.MimeType.JSON);
      case "getFilledWeeks":
        return ContentService.createTextOutput(JSON.stringify(getFilledWeeks(e.parameter.nama, e.parameter.bulan))).setMimeType(ContentService.MimeType.JSON);
      case "checkLaporan":
        return ContentService.createTextOutput(JSON.stringify(checkLaporan(e.parameter.nama, e.parameter.bulan, e.parameter.pekan))).setMimeType(ContentService.MimeType.JSON);
      case "checkTapel":
        try {
          const reqTapel = e.parameter.tapel;
          const sheetTapel = ss.getSheetByName('dataSPMB');
          if (sheetTapel && reqTapel) {
            const dataTapel = sheetTapel.getDataRange().getValues();
            for (let i = 1; i < dataTapel.length; i++) {
              if (dataTapel[i][0] && dataTapel[i][0].toString().trim() === reqTapel.trim()) {
                const statusTapel = dataTapel[i][5] ? dataTapel[i][5].toString().trim() : 'Buka';
                return ContentService.createTextOutput(JSON.stringify({
                  status: statusTapel
                })).setMimeType(ContentService.MimeType.JSON);
              }
            }
          }
        } catch (err) {
          // Fallback if error
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: "Buka"
        })).setMimeType(ContentService.MimeType.JSON);
        
      case "getWaTemplate":
        try {
          const sheetWa = ss.getSheetByName("dataSPMB");
          let correctionTemplate = "";
          let contactTemplate = "";
          if (sheetWa) {
            correctionTemplate = sheetWa.getRange("M5").getValue();
            contactTemplate = sheetWa.getRange("M4").getValue();
          }
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            correction: correctionTemplate ? correctionTemplate.toString() : "",
            contact: contactTemplate ? contactTemplate.toString() : ""
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (err) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: err.toString()
          })).setMimeType(ContentService.MimeType.JSON);
        }
        
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
                  token: dataCheck[i][1] ? dataCheck[i][1].toString() : '',
                  nama_lengkap: dataCheck[i][2] ? dataCheck[i][2].toString() : '',
                  nama_panggilan: dataCheck[i][3] ? dataCheck[i][3].toString() : '',
                  jenis_kelamin: dataCheck[i][4] ? dataCheck[i][4].toString() : '',
                  tgl_lahir: dataCheck[i][5] ? dataCheck[i][5].toString() : '',
                  tapel: dataCheck[i][6] ? dataCheck[i][6].toString() : '',
                  asal_sekolah: dataCheck[i][7] ? dataCheck[i][7].toString() : '',
                  nama_ayah: dataCheck[i][8] ? dataCheck[i][8].toString() : '',
                  pekerjaan_ayah: dataCheck[i][9] ? dataCheck[i][9].toString() : '',
                  nama_ibu: dataCheck[i][10] ? dataCheck[i][10].toString() : '',
                  pekerjaan_ibu: dataCheck[i][11] ? dataCheck[i][11].toString() : '',
                  alamat_rt: dataCheck[i][12] !== undefined ? dataCheck[i][12].toString() : '',
                  alamat_rw: dataCheck[i][13] !== undefined ? dataCheck[i][13].toString() : '',
                  alamat_desa: dataCheck[i][14] ? dataCheck[i][14].toString() : '',
                  alamat_kecamatan: dataCheck[i][15] ? dataCheck[i][15].toString() : '',
                  alamat_kabupaten: dataCheck[i][16] ? dataCheck[i][16].toString() : '',
                  nomor_hp: dataCheck[i][17] ? dataCheck[i][17].toString() : '',
                  sumber_info_check: dataCheck[i][18] ? dataCheck[i][18].toString() : ''
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
          asmaulHusna: getSheetData(ss, "AsmaulHusna"),
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
      case "getAsmaulHusna":
        data = getSheetData(ss, "AsmaulHusna");
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
        ["logo", "https://drive.google.com/uc?export=view&id=1gEHwUNqyq_qJridKdi7GtGVdOvrT2lKB"],
        ["judul", "AluswahGO"],
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
      name: "AsmaulHusna",
      headers: ["urutan", "latin", "arab", "arti"]
    },
    {
      name: "Kalender",
      headers: ["tanggal", "jenis", "kegiatan", "is_libur"]
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
        ["Selamat Datang di Portal Digital AluswahGO. Pendaftaran Siswa Baru Tahun Ajaran 2024/2025 telah dibuka!", "TRUE"]
      ]
    },
    {
      name: "Review",
      headers: ["Timestamp", "Peran", "Nama Wali", "Status Wali", "Nama Siswa", "Kelas", "Tahun Lulus", "Rating", "Testimoni", "Foto", "Status Tampil"],
      initialData: [
        [
          "04/04/2026 08:30:00", 
          "Wali Murid", 
          "Bapak Fulan", 
          "Ayah", 
          "Ahmad", 
          "1A", 
          "-", 
          "5", 
          "Alhamdulillah, anak saya semakin rajin sholat dan mengaji sejak bersekolah di sini.", 
          "https://picsum.photos/seed/user1/100/100", 
          "Approve"
        ],
        [
          "04/04/2026 09:15:00", 
          "Alumni", 
          "-", 
          "-", 
          "Siti Fulanah", 
          "6B", 
          "2020", 
          "5", 
          "Bangga pernah belajar di Al Uswah. Bekal agama dan ilmu umumnya sangat bermanfaat hingga saya di bangku kuliah sekarang.", 
          "https://picsum.photos/seed/user2/100/100", 
          "Approve"
        ]
      ]
    },
    {
      name: "Video",
      headers: ["judul", "url_youtube", "thumbnail"],
      initialData: [
        ["Profil AluswahGO", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://picsum.photos/seed/video1/400/300"]
      ]
    },
    {
      name: "Footer",
      headers: ["key", "value"],
      initialData: [
        ["teks_cta", "Mari bergabung bersama kami mencetak generasi Qur'ani, Mandiri, dan Berprestasi!"],
        ["no_wa", "6282333427597"],
        ["pesan_wa", "Halo Admin AluswahGO, saya ingin bertanya informasi pendaftaran siswa baru."],
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
    result[`_row${i+1}`] = value;
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

function handleUpdateSPMB(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Pendaftar_SPMB');
  if (!sheet) {
    sheet = initializeSPMBSheet();
  }
  
  const token = e.parameter.token;
  if (!token) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Token pendaftaran tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === token) { // Column B is Token (index 1)
      rowIndex = i + 1; // 1-based index
      break;
    }
  }
  
  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Data dengan token tersebut tidak ditemukan di database'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Update all editable columns (except Timestamp and Token)
  sheet.getRange(rowIndex, 3).setValue(e.parameter.nama_lengkap || '');
  sheet.getRange(rowIndex, 4).setValue(e.parameter.nama_panggilan || '');
  sheet.getRange(rowIndex, 5).setValue(e.parameter.jenis_kelamin || '');
  sheet.getRange(rowIndex, 6).setValue(e.parameter.tgl_lahir || '');
  sheet.getRange(rowIndex, 7).setValue(e.parameter.tapel || '');
  sheet.getRange(rowIndex, 8).setValue(e.parameter.asal_sekolah || '');
  sheet.getRange(rowIndex, 9).setValue(e.parameter.nama_ayah || '');
  sheet.getRange(rowIndex, 10).setValue(e.parameter.pekerjaan_ayah || '');
  sheet.getRange(rowIndex, 11).setValue(e.parameter.nama_ibu || '');
  sheet.getRange(rowIndex, 12).setValue(e.parameter.pekerjaan_ibu || '');
  sheet.getRange(rowIndex, 13).setValue(e.parameter.alamat_rt || '');
  sheet.getRange(rowIndex, 14).setValue(e.parameter.alamat_rw || '');
  sheet.getRange(rowIndex, 15).setValue(e.parameter.alamat_desa || '');
  sheet.getRange(rowIndex, 16).setValue(e.parameter.alamat_kecamatan || '');
  sheet.getRange(rowIndex, 17).setValue(e.parameter.alamat_kabupaten || '');
  sheet.getRange(rowIndex, 18).setValue(e.parameter.nomor_hp || '');
  sheet.getRange(rowIndex, 19).setValue(e.parameter.sumber_info_check || '');
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    token: token,
    message: 'Data pendaftaran berhasil diperbarui'
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleSubmitReview(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Review');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Sheet Review tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const timestamp = e.parameter.Timestamp || new Date().toLocaleString('id-ID');
  const peran = e.parameter.Peran || '';
  const namaWali = e.parameter['Nama Wali'] || '';
  const statusWali = e.parameter['Status Wali'] || '';
  const namaSiswa = e.parameter['Nama Siswa'] || '';
  const kelas = e.parameter.Kelas || '';
  const tahunLulus = e.parameter['Tahun Lulus'] || '';
  const rating = e.parameter.Rating || '';
  const testimoni = e.parameter.Testimoni || '';
  const foto = e.parameter.Foto || '';
  const statusTampil = 'Pending'; // Default status

  const rowData = [
    timestamp,
    peran,
    namaWali,
    statusWali,
    namaSiswa,
    kelas,
    tahunLulus,
    rating,
    testimoni,
    foto,
    statusTampil
  ];

  sheet.appendRow(rowData);

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Review berhasil dikirim'
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

// ================= YAUMIYAH BACKEND =================

const CONFIG_YAUMIYAH = {
  SHEET_NAME_GURU: 'DATA_GURU',
  SHEET_NAME_LAPORAN: 'Laporan',
  FOLDER_ID: '18qyef8u4GPzviKrVjI8SvEqOHpnL3Cl3', // ID Folder Induk MODUL_AJAR
  ADMIN_PASSWORD: 'bismillah'
};

function normalize(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkAdminPassword(input) {
  return input === CONFIG_YAUMIYAH.ADMIN_PASSWORD;
}

function getOrCreateTeacherFolder(rootId, teacherName) {
  const root = DriveApp.getFolderById(rootId);
  const safeName = String(teacherName).trim().replace(/[\/\\]/g, "_");
  
  const folders = root.getFoldersByName(safeName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return root.createFolder(safeName);
  }
}

function uploadFile(data, fileName, teacherName, bulan, pekan) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 

    const targetFolder = getOrCreateTeacherFolder(CONFIG_YAUMIYAH.FOLDER_ID, teacherName);
    
    const contentType = data.substring(5, data.indexOf(';'));
    const bytes = Utilities.base64Decode(data.substring(data.indexOf('base64,') + 7));
    
    const uniqueFileName = `${bulan}_Pekan${pekan}_${fileName}`;
    const blob = Utilities.newBlob(bytes, contentType, uniqueFileName);
    
    const file = targetFolder.createFile(blob);
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}
    
    return { success: true, url: file.getUrl() };

  } catch (e) {
    return { success: false, message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getDataGuru() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG_YAUMIYAH.SHEET_NAME_GURU);
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const lastCol = sheet.getLastColumn();
    if (lastCol < 3) return []; 

    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues(); 
    return data
      .map((r, i) => {
        const status = String(r[1] || "");
        const nama = String(r[2] || "").trim();
        const phone = String(r[3] || "").trim(); 
        if (!nama) return null;
        return {
          id: i + 1,
          nama,
          gender: status.toLowerCase().includes("ustadzah") ? "P" : "L",
          phone: phone 
        };
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

function getAllLaporan() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG_YAUMIYAH.SHEET_NAME_LAPORAN);
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const lastCol = sheet.getLastColumn();
    const numCols = lastCol > 0 ? lastCol : 1;

    const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

    const sanitizedData = data.map(row => {
      const safeRow = row.map(cell => {
        if (cell instanceof Date) return cell.toISOString();
        return cell;
      });

      return {
        raw: safeRow,
        nama: String(row[1] || ""),
        bulan: String(row[2] || ""),
        pekan: String(row[3] || ""),
        timestamp: row[30] ? String(row[30]) : ""
      };
    });

    return sanitizedData;

  } catch (e) {
    return [];
  }
}

function getFilledWeeks(nama, bulan) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG_YAUMIYAH.SHEET_NAME_LAPORAN);
    if (!sheet) return [];
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const lastCol = sheet.getLastColumn();
    if (lastCol < 4) return []; 
    
    const data = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
    if (!data || !Array.isArray(data)) return [];
    
    const targetName = normalize(nama);
    const targetBulan = normalize(bulan);

    const filled = data
      .filter(row => normalize(row[0]) === targetName && normalize(row[1]) === targetBulan)
      .map(row => String(row[2]));
      
    return [...new Set(filled)];
  } catch (e) {
    return [];
  }
}

function checkLaporan(nama, bulan, pekan) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG_YAUMIYAH.SHEET_NAME_LAPORAN);
    if (!sheet) return null;
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    
    const lastCol = sheet.getLastColumn();
    const numCols = lastCol > 0 ? lastCol : 1;

    const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
    if (!data) return null;

    const targetName = normalize(nama);
    const targetBulan = normalize(bulan);
    const targetPekan = normalize(pekan);

    const match = data.find(row => 
      normalize(row[1]) === targetName && 
      normalize(row[2]) === targetBulan && 
      normalize(row[3]) === targetPekan
    );

    if (!match) return null;

    const safeNum = (val) => Number(val) || 0;
    const safeBool = (val) => (val == 1 || val === "Ya");
    const getVal = (idx) => match[idx] !== undefined ? match[idx] : 0;
    const getRaw = (idx) => match[idx] !== undefined ? match[idx] : "";

    return {
      found: true,
      targetJamaah: safeNum(getVal(4)), sholatJamaah: safeNum(getVal(5)),
      targetMalam: safeNum(getVal(6)), sholatMalam: safeNum(getVal(7)),
      targetDhuha: safeNum(getVal(8)), sholatDhuha: safeNum(getVal(9)),
      targetTilawah: safeNum(getVal(10)), tilawah: safeNum(getVal(11)),
      targetPuasaSenin: safeNum(getVal(12)), puasaSenin: safeBool(getVal(13)),
      targetPuasaKamis: safeNum(getVal(14)), puasaKamis: safeBool(getVal(15)),
      
      targetPerangkat: safeNum(getVal(16)), 
      perangkat: getRaw(17), 

      targetDzikir: safeNum(getVal(18)), dzikir: safeNum(getVal(19)),
      targetMendoakan: safeNum(getVal(20)), mendoakan: safeNum(getVal(21)),
      targetInfaq: safeNum(getVal(22)), infaq: safeNum(getVal(23)),
      targetBacaBuku: safeNum(getVal(24)), bacaBuku: safeNum(getVal(25)),
      targetOlahraga: safeNum(getVal(26)), olahraga: safeNum(getVal(27)),
      targetMenyapa: safeNum(getVal(28)), menyapaSiswa: safeNum(getVal(29))
    };
  } catch (e) {
    return null;
  }
}

function simpanLaporan(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
  } catch (e) {
    return { success: false, message: "Server sibuk, coba lagi nanti." };
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG_YAUMIYAH.SHEET_NAME_LAPORAN);
    
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG_YAUMIYAH.SHEET_NAME_LAPORAN);
      sheet.appendRow([
        "No.", "Nama Guru", "Bulan", "Pekan", 
        "Target Jamaah", "4. Sholat Jamaah", "Target Malam", "5. Sholat Malam",
        "Target Dhuha", "6. Sholat Dhuha", "Target Tilawah", "7. Tilawah", 
        "Target Senin", "8. Puasa Senin", "Target Kamis", "9. Puasa Kamis", 
        "Target Perangkat", "10. Perangkat", "Target Dzikir", "11. Dzikir", 
        "Target Mendoakan", "12. Mendoakan", "Target Infaq", "13. Infaq", 
        "Target Baca Buku", "14. Baca Buku", "Target Olahraga", "15. Olahraga", 
        "Target Menyapa", "16. Menyapa", "Timestamp"
      ]);
      sheet.setFrozenRows(1);
    }

    const lastRow = sheet.getLastRow();
    let rowIndexToUpdate = -1;
    let nomorUrut = lastRow;

    if (lastRow >= 2) {
      const lastCol = sheet.getLastColumn();
      const numColsCheck = lastCol >= 4 ? 3 : (lastCol >= 2 ? lastCol - 1 : 0);
      
      if (numColsCheck >= 3) {
          const keyData = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
          const targetName = normalize(data.nama);
          const targetBulan = normalize(data.bulan);
          const targetPekan = normalize(data.pekan);

          if (keyData && Array.isArray(keyData)) {
            for (let i = 0; i < keyData.length; i++) {
              if (normalize(keyData[i][0]) === targetName && 
                  normalize(keyData[i][1]) === targetBulan && 
                  normalize(keyData[i][2]) === targetPekan) {
                rowIndexToUpdate = i + 2; 
                nomorUrut = i + 1; 
                break;
              }
            }
          }
      }
    }

    const timestamp = new Date();
    const rowData = [
      nomorUrut, data.nama, data.bulan, data.pekan,
      data.targetJamaah, data.sholatJamaah,
      data.targetMalam, data.sholatMalam,
      data.targetDhuha, data.sholatDhuha,
      data.targetTilawah, data.tilawah,
      data.targetPuasaSenin, data.puasaSenin ? 1 : 0,
      data.targetPuasaKamis, data.puasaKamis ? 1 : 0,
      data.targetPerangkat, data.perangkat, 
      data.targetDzikir, data.dzikir,
      data.targetMendoakan, data.mendoakan,
      data.targetInfaq, data.infaq,
      data.targetBacaBuku, data.bacaBuku,
      data.targetOlahraga, data.olahraga,
      data.targetMenyapa, data.menyapaSiswa,
      timestamp
    ];

    if (rowIndexToUpdate > 0) {
      sheet.getRange(rowIndexToUpdate, 1, 1, rowData.length).setValues([rowData]);
      return { success: true, message: "Data berhasil diperbarui (Update)", type: "update" };
    } else {
      sheet.appendRow(rowData);
      return { success: true, message: "Data berhasil disimpan (Baru)", type: "new" };
    }

  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}
