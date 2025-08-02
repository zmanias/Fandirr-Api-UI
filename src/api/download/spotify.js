const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');

module.exports = function(app) {

/**
 * Fungsi inti untuk mengunduh dari Spotifydown.
 * Mengambil URL Spotify dan mengembalikan link unduhan audio.
 * @param {string} url - URL lagu Spotify.
 * @returns {Promise<string>} - URL unduhan langsung ke file audio.
 */
async function spotifyDownload(url) {
  const form = new FormData();
  form.append('url', url);

  // Headers ini meniru permintaan dari browser saat menggunakan situsnya
  const headers = {
    ...form.getHeaders(),
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://spotifydown.org/',
    // Catatan: Cookie ini mungkin memiliki masa kadaluarsa. Jika scraper berhenti bekerja,
    // cookie ini mungkin perlu diperbarui dengan mengambil nilai baru dari browser.
    'Cookie': 'PHPSESSID=15413bc7c430378c3d2848c15d901dcb;codehap_domain=spotifydown.org;csrf_token=e2b4219c1ebda5fac8b7ce4b6e37ca222b4a8599e7fdbb730324a5e2638b41b5'
  };

  // Melakukan POST request ke server Spotifydown
  const { data } = await axios.post('https://spotifydown.org/result.php', form, { 
    headers,
    timeout: 30000 // Timeout 30 detik
  });
  
  // Memuat HTML yang diterima ke Cheerio untuk di-scrape
  const $ = cheerio.load(data);
  // Mencari link unduhan dari tag <a> dengan class 'dlbtnhigh'
  const downloadLink = $('a.dlbtnhigh').attr('href');
  
  if (!downloadLink) {
    // Jika link tidak ditemukan, coba cari pesan error dari situsnya
    const errorMsg = $('.error').text() || 'Link download tidak ditemukan pada halaman hasil.';
    throw new Error(errorMsg);
  }
  
  return downloadLink;
}

// === ENDPOINT UTAMA API ===
app.get('/spotify/download', async (req, res) => {
  // Ambil URL dari query parameter
  const { url } = req.query;

  // 1. Validasi: Periksa apakah parameter URL ada
  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'Parameter "url" wajib diisi.'
    });
  }

  // 2. Validasi: Periksa format URL Spotify
  const spotifyRegex = /https?:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/;
  if (!spotifyRegex.test(url)) {
    return res.status(400).json({
      status: 'error',
      message: 'Format URL Spotify tidak valid.'
    });
  }

  try {
    // 3. Panggil fungsi inti untuk mendapatkan link unduhan
    console.log(`Mencoba mengunduh dari: ${url}`);
    const downloadUrl = await spotifyDownload(url);

    // 4. Kirim respons sukses
    res.json({
      status: 'success',
      download_url: downloadUrl
    });

  } catch (e) {
    // 5. Kirim respons error jika terjadi kegagalan
    console.error(e);
    res.status(500).json({
      status: 'error',
      message: e.message || 'Terjadi kesalahan internal pada server.'
    });
  }
});
}