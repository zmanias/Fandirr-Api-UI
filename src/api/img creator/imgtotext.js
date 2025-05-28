import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import axios from 'axios';

module.exports = function(app) {

// Setup multer untuk menerima upload file
const upload = multer({ storage: multer.memoryStorage() });

// Fungsi untuk memproses gambar ke imagepromptguru
const imagepromptguru = async (buffer, options = {}) => {
  const image = 'data:image/jpeg;base64,' + buffer.toString('base64');
  const { model = 'general', language = 'en' } = options;
  const headers = {
    'content-type': 'application/json',
    'origin': 'https://imagepromptguru.net',
    'referer': 'https://imagepromptguru.net/',
  };
  const body = JSON.stringify({ model, language, image });

  const response = await fetch('https://api.imagepromptguru.net/image-to-prompt', {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) throw new Error(`Terjadi kesalahan. ${response.status} ${response.statusText}`);

  return await response.json();
};

// Endpoint 1: Upload file
app.post('/api/image-to-prompt', upload.single('image'), async (req, res) => {
  const buffer = req.file?.buffer;
  const { model, language } = req.body;

  if (!buffer) {
    return res.status(400).json({ error: 'Gambar tidak ditemukan dalam request.' });
  }

  try {
    const result = await imagepromptguru(buffer, { model, language });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint 2: Kirim gambar lewat URL
app.get('/imgcreator/imgtotext', async (req, res) => {
  const { url, model = 'general', language = 'en' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter url diperlukan.' });
  }

  try {
    // Unduh gambar dari URL
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // Proses ke API
    const result = await imagepromptguru(buffer, { model, language });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mendeteksi dari URL: ' + err.message });
  }
});
}