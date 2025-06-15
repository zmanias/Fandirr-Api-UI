const express = require('express');
const fetch = require('node-fetch'); // versi 2, agar bisa pakai require
const cheerio = require('cheerio');
const cors = require('cors');

module.exports = function(app) {

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

async function An1ByPontaJs(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1.title').first().text().trim();

    const version = $('.spec li').filter((i, el) => {
      return $(el).text().toLowerCase().includes('version');
    }).text().replace(/Version:/i, '').trim();

    const os = $('.spec li').filter((i, el) => {
      return $(el).text().toLowerCase().includes('android');
    }).text().trim();

    const size = $('.spec li').filter((i, el) => {
      return $(el).find('i.size').length > 0 || $(el).text().toLowerCase().includes('mb');
    }).text().trim();

    const description = $('.description #spoiler').text().trim();

    const developer = $('.developer[itemprop="publisher"] span[itemprop="name"]').text().trim();

    const ratingText = $('.rate_num span[itemprop="ratingValue"]').text().trim();
    const ratingCount = $('.rate_num span[itemprop="ratingCount"]').text().trim();

    const downloadLink = $('.spec_addon a.btn-green').attr('href');
    const downloadUrl = downloadLink ? new URL(downloadLink, url).href : null;

    const updated = $('.app_moreinfo_item.gplay ul.spec li time[itemprop="datePublished"]').attr('datetime') || '';
    const price = $('.app_moreinfo_item.gplay ul.spec li[itemprop="offers"] span[itemprop="price"]').text().trim();
    const installs = $('.app_moreinfo_item.gplay ul.spec li').filter((i, el) => {
      return $(el).text().toLowerCase().includes('installs');
    }).text().replace(/Installs/i, '').trim();

    return {
      title,
      version,
      os,
      size,
      description,
      developer,
      rating: ratingText,
      ratingCount,
      downloadUrl,
      updated,
      price,
      installs
    };

  } catch (error) {
    console.error('Error scraping detail:', error);
    throw error;
  }
}

// 🔍 Endpoint: GET /api/detail?url=https://an1.com/7029-capcut-video-editor-apk.html
app.use(cors());
app.get('/stalk/an1', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://an1.com/')) {
    return res.status(400).json({ error: 'Parameter url tidak valid atau kosong' });
  }

  try {
    const result = await An1ByPontaJs(url);
    if (!result) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});
}