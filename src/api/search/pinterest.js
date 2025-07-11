const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

module.exports = function(app) {

async function pinterestSearch(keyword, max = 20) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
  );
  await page.goto(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}`, {
    waitUntil: 'networkidle2'
  });

  const results = await page.evaluate((maxItems) => {
    const imgs = Array.from(document.querySelectorAll('img[src^="https://i.pinimg.com/"]'));
    return imgs.slice(0, maxItems).map(img => ({
      image: img.src,
      alt: img.alt || '',
      link: img.closest('a')?.href || ''
    }));
  }, max);

  await browser.close();
  return results;
}

app.get('/search/pin', async (req, res) => {
  const { query, limit = 20 } = req.query;
  if (!query) return res.status(400).json({ status: false, message: 'Parameter "query" wajib diisi' });

  try {
    const data = await pinterestSearch(query, Number(limit));
    res.json({ status: true, total: data.length, results: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Gagal mengambil data', error: err.message });
  }
});
}