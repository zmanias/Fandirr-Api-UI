const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = function(app, validateApiKey) {
const DOMAIN = 'https://api.fandirr.my.id'; // Ganti ke domainmu

const UPLOAD_FOLDER = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `img_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Static folder untuk akses publik
app.use('/uploads', express.static(UPLOAD_FOLDER));

/** ✅ Upload file dan kembalikan URL */
app.post('/api/tourl', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File gambar tidak ditemukan.' });

  const fileUrl = `${DOMAIN}/uploads/${req.file.filename}`;
  res.json({ success: true, filename: req.file.filename, url: fileUrl });
});

/** 📋 List semua gambar yang diupload */
app.get('/api/listurl', async (req, res) => {
  fs.readdir(UPLOAD_FOLDER, (err, files) => {
    if (err) return res.status(500).json({ error: 'Gagal membaca folder upload.' });

    const list = files.map(file => ({
      filename: file,
      url: `${DOMAIN}/uploads/${file}`
    }));
    res.json({ count: list.length, images: list });
  });
});

/** ❌ Hapus gambar dari server */
app.get('/api/delurl', async (req, res) => {
  const filename = req.query.file;
  if (!filename) return res.status(400).json({ error: 'Parameter "file" wajib diisi.' });

  const filePath = path.join(UPLOAD_FOLDER, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File tidak ditemukan.' });

  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus file.' });
    res.json({ success: true, message: `File "${filename}" berhasil dihapus.` });
  });
});
}