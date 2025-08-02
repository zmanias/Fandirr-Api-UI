const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

module.exports = function(app) {

// Konfigurasi Multer untuk menangani file upload di memori
// Kita tidak perlu menyimpannya ke disk, cukup di buffer untuk diteruskan.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Fungsi untuk meng-upload buffer file ke Catbox.moe
 * @param {Buffer} buffer - Buffer dari file yang akan di-upload.
 * @param {string} originalname - Nama asli file untuk metadata.
 * @returns {Promise<string>} - URL dari file yang berhasil di-upload.
 */
async function uploadToCatbox(buffer, originalname) {
  // Membuat form data baru
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  // Menambahkan file ke form dengan nama 'fileToUpload' sesuai API Catbox
  form.append('fileToUpload', buffer, { filename: originalname });

  try {
    // Mengirim form data ke API Catbox menggunakan axios
    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders(), // Penting: Menggunakan headers dari form-data
      },
    });

    // API Catbox mengembalikan URL sebagai teks biasa
    return response.data;
  } catch (error) {
    console.error('Error uploading to Catbox:', error.message);
    throw new Error('Gagal meng-upload file ke server tujuan.');
  }
}

// === ENDPOINT UTAMA ===
// Endpoint ini akan menerima file dengan field name 'file'
app.post('/catbox/upload', upload.single('file'), async (req, res) => {
  // Periksa apakah ada file yang di-upload
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'Tidak ada file yang di-upload. Gunakan field name "file".',
    });
  }

  // Periksa tipe MIME, mirip seperti di kode asli
  if (!/image|video/.test(req.file.mimetype)) {
      return res.status(400).json({
          status: 'error',
          message: 'Hanya file gambar atau video yang diizinkan.'
      })
  }
  
  try {
    // Ambil buffer dan nama asli file dari multer
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    // Panggil fungsi upload
    const fileUrl = await uploadToCatbox(fileBuffer, originalName);

    // Kirim respons sukses dalam format JSON
    res.json({
      status: 'success',
      url: fileUrl,
      expired: 'Permanen'
    });
  } catch (error) {
    // Kirim respons error jika terjadi kegagalan
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});
}