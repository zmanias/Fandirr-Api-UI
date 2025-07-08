const express = require('express');
const axios = require('axios');
const fetch = require('node-fetch');
const multer = require('multer');

module.exports = function(app, validateApiKey) {
  
  const upload = multer({ storage: multer.memoryStorage() });

  // Fungsi API ImagePromptGuru
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

    if (!response.ok) throw new Error(`Terjadi kesalahan: ${response.status} ${response.statusText}`);

    return await response.json();
  };

  // Endpoint GET lewat URL gambar
  app.get('/api/image-to-prompt', async (req, res) => {
    const { url, model = 'general', language = 'en' } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Parameter `url` diperlukan.' });
    }

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const result = await imagepromptguru(buffer, { model, language });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil atau mengirim gambar: ' + err.message });
    }
  });

  // Endpoint GET untuk upload file base64 (alternatif GET untuk upload)
  app.get('/api/image-to-prompt/base64', async (req, res) => {
    const { base64, model = 'general', language = 'en' } = req.query;

    if (!base64) {
      return res.status(400).json({ error: 'Parameter `base64` gambar diperlukan.' });
    }

    try {
      const buffer = Buffer.from(base64, 'base64');
      const result = await imagepromptguru(buffer, { model, language });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Gagal memproses gambar base64: ' + err.message });
    }
  });
};