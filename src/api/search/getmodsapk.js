import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

module.exports = function(app) {

// Fungsi pencarian
async function SearchByPonta(query) {
  try {
    const url = `https://getmodsapk.com/search?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) throw new Error(`Gagal fetch halaman: ${response.statusText}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const notFound = $('div').filter((i, el) => $(el).text().includes('Posts not found!')).length > 0;
    if (notFound) return [];

    const results = [];
    $('div.grid > a').each((_, element) => {
      const title = $(element).find('h3').text().trim();
      const link = $(element).attr('href');
      const image = $(element).find('img.lazyload').attr('src');
      const status = $(element).find('span.bg-green-100').text().trim();
      const size = $(element).find('span:contains("Size:")').next().text().trim();
      const version = $(element).find('span.text-xs.text-gray-600').first().text().trim();
      const modFeature = $(element).find('span[style*="color: rgb(22, 163, 74)"]').text().trim();

      if (title && link) {
        results.push({
          title,
          link: link.startsWith('http') ? link : `https://getmodsapk.com${link}`,
          image: image ? (image.startsWith('http') ? image : `https://getmodsapk.com${image}`) : 'N/A',
          status: status || 'N/A',
          size: size || 'N/A',
          version: version || 'N/A',
          modFeature: modFeature || 'N/A',
        });
      }
    });

    return results;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

// Endpoint API GET
app.get('/search/getmodsapk', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Parameter "query" wajib diisi.' });

  try {
    const results = await SearchByPonta(query);
    if (!results.length) {
      return res.status(404).json({ message: 'Tidak ada hasil ditemukan.' });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}