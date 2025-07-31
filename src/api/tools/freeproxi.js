const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app, validateApiKey) {

/**
 * Fungsi inti untuk melakukan scraping data proksi.
 * @returns {Promise<Array<object>>} Array berisi objek proksi.
 */
async function scrapeProxies() {
  const url = 'https://free-proxy-list.net/id/';
  try {
    // 1. Ambil konten HTML dari website
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
      }
    });

    // 2. Muat HTML ke cheerio untuk parsing
    const $ = cheerio.load(html);
    const proxies = [];

    // 3. Cari tabel dan iterasi setiap baris (tr) di dalam tbody
    $('table.table-striped tbody tr').each((index, element) => {
      const columns = $(element).find('td');

      // Pastikan baris memiliki kolom yang cukup
      if (columns.length >= 8) {
        const proxyData = {
          ipAddress: $(columns[0]).text().trim(),
          port: $(columns[1]).text().trim(),
          code: $(columns[2]).text().trim(),
          country: $(columns[3]).text().trim(),
          anonymity: $(columns[4]).text().trim(),
          google: $(columns[5]).text().trim(),
          https: $(columns[6]).text().trim(),
          lastChecked: $(columns[7]).text().trim(),
        };
        proxies.push(proxyData);
      }
    });

    return proxies;

  } catch (error) {
    console.error('Gagal melakukan scraping:', error.message);
    throw new Error('Tidak dapat mengambil data dari sumber.');
  }
}

// === ENDPOINT API ===
app.get('/tools/freeproxi', validateApiKey, async (req, res) => {
  try {
    const data = await scrapeProxies();
    res.json({
      status: 'success',
      count: data.length,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
}