const express = require('express');
const axios = require('axios');
const cors = require('cors');

module.exports = function(app) {

// Endpoint Terabox
app.get('/download/terabox', async (req, res) => {
  const link = req.query.url;

  if (!link) return res.status(400).json({ error: '❌ Parameter url wajib diisi.' });

  if (!/^https:\/\/(1024)?terabox\.com\/s\//.test(link)) {
    return res.status(400).json({ error: '❌ Link tidak valid! Harus dari terabox.com atau 1024terabox.com' });
  }

  try {
    const response = await axios.post('https://teraboxdownloader.online/api.php',
      { url: link },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://teraboxdownloader.online',
          'Referer': 'https://teraboxdownloader.online/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': '*/*'
        }
      }
    );

    const data = response.data;

    if (!data?.direct_link) {
      return res.status(404).json({ error: '❌ Tidak ada link download ditemukan.', debug: data });
    }

    return res.json({
      file_name: data.file_name,
      size: data.size,
      size_bytes: data.sizebytes,
      direct_link: data.direct_link,
      thumb: data.thumb
    });

  } catch (err) {
    return res.status(500).json({ error: '❌ Gagal mengakses web.', detail: err.message });
  }
});
}