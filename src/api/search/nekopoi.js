const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const cheerio  = require('cheerio');

module.exports = function(app) {

/* ────────────────────────────────────────────────────────────
   Core – Scrape Nekopoi
─────────────────────────────────────────────────────────────*/
async function nekopoiSearch(query, page = 1) {
  const baseUrl = 'https://nekopoi.care/search/';
  const url =
    page === 1
      ? `${baseUrl}${encodeURIComponent(query)}`
      : `${baseUrl}${encodeURIComponent(query)}/page/${page}/?${encodeURIComponent(query)}`;

  const results = [];

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    $('div.result ul li').each((_, el) => {
      const titleEl = $(el).find('h2 a');
      const title   = titleEl.text().trim();
      const link    = titleEl.attr('href');
      const thumb   = $(el).find('img').attr('src');
      if (title && link) results.push({ title, url: link, thumbnail: thumb });
    });

    return results;
  } catch (err) {
    console.error('Scrape error:', err.message);
    return [];
  }
}

/* ────────────────────────────────────────────────────────────
   GET /api/nekopoi?query=<kata>&page=<n>
─────────────────────────────────────────────────────────────*/
app.get('/search/nekopoi', async (req, res) => {
  const { query, page = 1 } = req.query;
  if (!query)
    return res.status(400).json({ status: false, message: 'Parameter query wajib diisi.' });

  const results = await nekopoiSearch(query, parseInt(page, 10));
  res.json({
    status : true,
    total  : results.length,
    query,
    page   : Number(page),
    results
  });
});
}