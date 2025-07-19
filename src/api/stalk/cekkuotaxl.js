const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// --- Konfigurasi Anti-Spam ---
const COOLDOWN_SECONDS = 60; // Waktu tunggu dalam detik sebelum nomor bisa dicek lagi
const requestTimestamps = new Map(); // Menyimpan timestamp terakhir untuk setiap nomor

/**
 * Endpoint untuk mengecek kuota XL.
 * Metode: GET
 * Query Params: ?nomor=...
 */
app.get('/stalk/cek-kuotaxl', async (req, res) => {
  const { nomor } = req.query;

  // 1. Validasi Input
  if (!nomor) {
    return res.status(400).json({
      success: false,
      error: 'Parameter query "nomor" wajib diisi.'
    });
  }

  // 2. Cek Anti-Spam
  const now = Date.now();
  const lastRequestTime = requestTimestamps.get(nomor);

  if (lastRequestTime && (now - lastRequestTime) < COOLDOWN_SECONDS * 1000) {
    const timeLeft = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastRequestTime)) / 1000);
    return res.status(429).json({
      success: false,
      error: 'Terlalu banyak permintaan.',
      message: `Silakan coba lagi untuk nomor ini dalam ${timeLeft} detik.`
    });
  }

  // 3. Proses Permintaan
  try {
    const headers = {
      'authority': 'script.google.com',
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'origin': 'https://2079164363-atari-embeds.googleusercontent.com',
      'referer': 'https://2079164363-atari-embeds.googleusercontent.com/',
      'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'x-client-data': 'CI//ygE='
    };

    const response = await axios.get(`https://script.google.com/macros/s/AKfycbzWc8Gw-nDH_1BGZFsswNedO5v0GDV46NBe7RNaO_4xqMXxaLeEzp-YXodMju8shFoypw/exec?msisdn=${nomor}`, {
      headers: headers,
      timeout: 15000 // Timeout 15 detik
    });

    // Jika berhasil, update timestamp untuk nomor ini
    requestTimestamps.set(nomor, now);

    // Kirim respons sukses
    res.status(200).json({
        success: true,
        data: response.data
    });

  } catch (error) {
    // Tangani error, misalnya timeout atau nomor tidak valid
    console.error("Error saat menghubungi API eksternal:", error.message);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data kuota.',
      details: error.response ? error.response.data : error.message
    });
  }
});
}