const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// ⚠️ Letakkan Kunci API RapidAPI Anda langsung di sini. SANGAT TIDAK AMAN!
const RAPIDAPI_KEY = "1dda0d29d3mshc5f2aacec619c44p16f219jsn99a62a516f98";

// Middleware untuk membaca body JSON
app.use(express.json());

/**
 * Endpoint untuk mengunduh media dari berbagai platform.
 * Metode: GET
 * Query Params: ?url=...
 */
app.get('/download/aio', async (req, res) => {
  // Ambil URL dari parameter query
  const { url } = req.query;

  // 1. Validasi Input
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Parameter query "url" wajib diisi.'
    });
  }

  try {
    // 2. Kirim permintaan ke API eksternal
    const response = await axios.post('https://auto-download-all-in-one.p.rapidapi.com/v1/social/autolink', 
      {
        url: url // Body dari request POST
      }, 
      {
        headers: {
          'accept-encoding': 'gzip',
          'cache-control': 'no-cache',
          'content-type': 'application/json; charset=utf-8',
          'referer': 'https://auto-download-all-in-one.p.rapidapi.com/',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36 OPR/78.0.4093.184',
          'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
          // Menggunakan kunci yang ditulis langsung di atas
          'x-rapidapi-key': RAPIDAPI_KEY 
        }
      }
    );

    // 3. Kirim kembali data yang diterima sebagai respons
    res.status(200).json({
        success: true,
        data: response.data
    });

  } catch (error) {
    // 4. Tangani error dengan lebih informatif
    console.error("Error saat menghubungi RapidAPI:", error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data dari layanan eksternal.',
      details: error.response ? error.response.data : { message: error.message }
    });
  }
});
}