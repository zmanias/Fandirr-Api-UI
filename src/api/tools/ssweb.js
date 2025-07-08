const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

module.exports = function(app, validateApiKey) {

// Endpoint Screenshot Website
app.get('/tools/ssweb', async (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Parameter "url" tidak valid atau kosong.' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const buffer = await page.screenshot({ type: 'png', fullPage: true });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="screenshot.png"',
      'Content-Length': buffer.length
    });

    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil screenshot', details: err.message });
  } finally {
    if (browser) await browser.close();
  }
});
}