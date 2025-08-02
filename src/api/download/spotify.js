const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');

module.exports = function(app) {

/**
 * Fungsi inti untuk mengunduh dari Spotifydown.
 * @param {string} url - URL lagu Spotify.
 * @returns {Promise<string>} - URL unduhan langsung ke file audio.
 */
async function spotifyDownload(url) {
  const form = new FormData();
  form.append('url', url);

  const headers = {
    ...form.getHeaders(),
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://spotifydown.org/',
    'Cookie': 'PHPSESSID=15413bc7c430378c3d2848c15d901dcb;codehap_domain=spotifydown.org;csrf_token=e2b4219c1ebda5fac8b7ce4b6e37ca222b4a8599e7fdbb730324a5e2638b41b5'
  };

  const { data } = await axios.post('https://spotifydown.org/result.php', form, { 
    headers,
    timeout: 30000
  });
  
  const $ = cheerio.load(data);
  const downloadLink = $('a.dlbtnhigh').attr('href');
  
  if (!downloadLink) {
    const errorMsg = $('.error').text() || 'Link download tidak ditemukan pada halaman hasil.';
    throw new Error(errorMsg);
  }
  
  return downloadLink;
}

// === ENDPOINT UTAMA API ===
app.get('/download/spotify', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'Parameter "url" wajib diisi.'
    });
  }

  // --- PERUBAHAN DI SINI ---
  // Regex diubah untuk memvalidasi format URL googleusercontent.com/spotify.com/
  const validUrlRegex = /https?:\/\/googleusercontent\.com\/spotify\.com\/[a-zA-Z0-9]+/;
  if (!validUrlRegex.test(url)) {
    return res.status(400).json({
      status: 'error',
      message: 'Format URL tidak valid. Gunakan format http://googleusercontent.com/spotify.com/...'
    });
  }

  try {
    console.log(`Mencoba mengunduh dari: ${url}`);
    const downloadUrl = await spotifyDownload(url);

    res.json({
      status: 'success',
      download_url: downloadUrl
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: 'error',
      message: e.message || 'Terjadi kesalahan internal pada server.'
    });
  }
});
}