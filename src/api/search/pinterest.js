const express  = require('express');
const axios    = require('axios');
const cheerio  = require('cheerio');
const cors     = require('cors');

module.exports = function(app) {

/**
 * Ambil gambar Pinterest via scraping.
 * @param {string} keyword  – Kata kunci pencarian.
 * @param {number} max      – Batas jumlah hasil.
 * @returns {Promise<Array>}  Array objek { image, alt, link }
 */
async function pinterestSearch(keyword, max = 20) {
  const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}`;

  const { data: html } = await axios.get(url, {
    headers: {
      // Pakai UA desktop supaya Pinterest kirim HTML biasa
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(html);
  const results = [];

  // Gambar biasanya berada di tag img[data-test-id="pin-image"]
  $('img[src^="https://i.pinimg.com/"]').each((i, img) => {
    if (results.length >= max) return false; // hentikan loop
    const image = $(img).attr('src');
    const alt   = $(img).attr('alt') || '';
    const pin   = $(img).closest('a').attr('href') || '';
    const link  = pin ? `https://www.pinterest.com${pin}` : '';

    results.push({ image, alt, link });
  });

  return results;
}

/* ================================================================
   Endpoint GET /api/pinterest?query=<keyword>&limit=<angka>
   ================================================================ */
app.get('/search/pin', async (req, res) => {
  const { query, limit = 20 } = req.query;

  if (!query)
    return res
      .status(400)
      .json({ status: false, message: 'Parameter query wajib diisi' });

  try {
    const images = await pinterestSearch(query, parseInt(limit, 10));
    res.json({
      status: true,
      total: images.length,
      results: images,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: false,
      message: 'Gagal mengambil data dari Pinterest',
      error: err.message,
    });
  }
});
}