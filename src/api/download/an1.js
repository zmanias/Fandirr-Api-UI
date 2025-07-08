const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

module.exports = function(app, validateApiKey) {

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

async function scrapeAn1Download(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const fileName = $('h1.title.fbold').text().trim();
    const downloadLink = $('#pre_download').attr('href');
    const downloadUrl = downloadLink ? new URL(downloadLink, url).href : null;

    return { fileName, downloadUrl };
  } catch (error) {
    throw new Error('Gagal scraping: ' + error.message);
  }
}

// Endpoint: /api/an1/download?url=
app.get('/download/an1', async (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Parameter url tidak valid atau kosong' });
  }

  try {
    const result = await scrapeAn1Download(url);
    if (!result.downloadUrl) {
      return res.status(404).json({ error: 'Link download tidak ditemukan' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}