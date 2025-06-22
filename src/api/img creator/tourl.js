const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = function(app) {
const DOMAIN = 'https://api.fandirr.my.id'; // Ganti dengan domain kamu

// Folder penyimpanan
const UPLOAD_FOLDER = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `img_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Static folder agar gambar bisa diakses publik
app.use('/uploads', express.static(UPLOAD_FOLDER));

// Endpoint upload
app.post('/imgcreator/tourl', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File gambar tidak ditemukan.' });

  const fileUrl = `${DOMAIN}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    filename: req.file.filename,
    url: fileUrl
  });
});
}