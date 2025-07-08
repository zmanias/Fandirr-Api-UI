const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app, validateApiKey) {

app.get('/download/tiktok', async (req, res) => {
  const { url } = req.query;

  if (!url || !/^https:\/\/(vt|www)\.tiktok\.com/.test(url)) {
    return res.status(400).json({ error: '❌ Link TikTok tidak valid, senpai!' });
  }

  try {
    const response = await axios.post('https://snap-tok.com/api/download', {
      id: url,
      locale: 'id'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://snap-tok.com',
        'Referer': 'https://snap-tok.com/tiktok-downloader'
      }
    });

    const $ = cheerio.load(response.data);

    const videoUrl = $('a[href*="tikcdn.io"]').first().attr('href');
    const username = $('h2').first().text().trim() || 'Tidak diketahui';
    const caption = $('p.maintext, div.text-gray-500').first().text().trim() || 'Tanpa deskripsi';

    if (!videoUrl) {
      return res.status(404).json({
        error: '❌ Video tidak ditemukan, mungkin private atau SnapTok sedang error, senpai 😢'
      });
    }

    return res.json({
      username,
      caption,
      videoUrl
    });

  } catch (err) {
    console.error('Hmm, error senpai:', err.message);
    return res.status(500).json({ error: '❌ Gagal mengambil data dari SnapTok, senpai! 😓' });
  }
});
}