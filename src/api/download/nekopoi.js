/* eslint-disable no-console */
const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const cheerio  = require('cheerio');

module.exports = function(app) {

/* ────────────────────────────────────────────────────────────────
   Function: Ambil detail Nekopoi
─────────────────────────────────────────────────────────────────*/
async function nekopoiDetail(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);

    const result = {
      title    : $('div.eroinfo h1').text().trim(),
      thumbnail: $('div.thm img').attr('src') || '',
      parody   : '',
      producer : '',
      duration : '',
      views    : '',
      date     : '',
      sizes    : {},
      streams  : [],
      downloads: {},
    };

    // Info parody, producer, durasi, size
    $('div.konten p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.startsWith('Parody'))     result.parody   = text.replace('Parody : ', '').trim();
      else if (text.startsWith('Producers')) result.producer = text.replace('Producers : ', '').trim();
      else if (text.startsWith('Duration'))  result.duration = text.replace('Duration : ', '').trim();
      else if (text.includes('Size')) {
        const m = text.match(/(\d+p)\s*:\s*([\d.]+\s*mb)/gi) || [];
        m.forEach(v => {
          const [res, size] = v.split(/\s*:\s*/);
          result.sizes[res.trim()] = size.trim();
        });
      }
    });

    // Views & date
    const infoText = $('div.eroinfo p').text();
    result.views = infoText.match(/Dilihat\s+(\d+)\s+kali/)?.[1] || '';
    result.date  = infoText.match(/\/\s+(.+)/)?.[1]?.trim() || '';

    // Streams (iframe)
    $('div#show-stream div.openstream iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src) result.streams.push({ name: `Stream ${i + 1}`, url: src });
    });

    // Downloads
    $('div.boxdownload div.liner').each((_, el) => {
      const res = $(el).find('div.name').text().match(/\[(\d+p)\]/)?.[1];
      if (!res) return;

      const links = { normal: [], ouo: [] };
      $(el).find('div.listlink p a').each((__, a) => {
        const href = $(a).attr('href');
        const name = $(a).text().trim().replace('[ouo]', '').trim();
        if (href.includes('ouo.io')) links.ouo.push({ name, url: href });
        else                         links.normal.push({ name, url: href });
      });
      result.downloads[res] = links;
    });

    return result;
  } catch (e) {
    throw new Error(`Scrape gagal: ${e.message}`);
  }
}

/* ────────────────────────────────────────────────────────────────
   Endpoint  GET /api/nekopoi/detail?url=<link>
─────────────────────────────────────────────────────────────────*/
app.get('/download/nekopoi', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ status: false, message: 'Parameter url wajib diisi.' });
  }

  try {
    const detail = await nekopoiDetail(url);
    res.json({ status: true, detail });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});
}