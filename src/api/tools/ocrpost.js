const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');

module.exports = function(app) {
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Gambar tidak ditemukan' });

    const buffer = req.file.buffer;

    const result = await Tesseract.recognize(buffer, 'eng+ind', {
      logger: m => console.log(m)
    });

    const text = result.data.text.trim();

    if (!text) {
      return res.json({ status: 'success', message: 'Teks tidak terbaca dari gambar.' });
    }

    res.json({
      status: 'success',
      text
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses OCR', detail: err.message });
  }
});
}