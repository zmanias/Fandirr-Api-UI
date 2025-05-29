import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

module.exports = function(app) {

// Fungsi Detail Scraper
async function DetailByPonta(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const jsonLd = $('script[type="application/ld+json"]')
      .map((_, el) => $(el).html())
      .get()
      .find(j => j.includes('"@type":"SoftwareApplication"'));

    let schema = {};
    if (jsonLd) {
      try {
        schema = JSON.parse(jsonLd);
      } catch {}
    }

    const judul = schema.name || $('title').text().trim();
    const versi = schema.softwareVersion || '';
    const size = schema.fileSize || '';
    const rating = schema.aggregateRating?.ratingValue || '';
    const ratingCount = schema.aggregateRating?.ratingCount || '';
    const lastUpdate = schema.dateModified || '';
    const developer = schema.author?.name || '';

    let thumbnail = schema.thumbnailUrl || '';
    if (thumbnail && !/^https?:\/\//.test(thumbnail)) {
      thumbnail = new URL(thumbnail, url).href;
    }

    let category = 'apk';
    try {
      const breadcrumbJsonLd = $('script[type="application/ld+json"]')
        .map((_, el) => $(el).html())
        .get()
        .find(j => j.includes('"@type":"BreadcrumbList"'));
      if (breadcrumbJsonLd) {
        const breadcrumb = JSON.parse(breadcrumbJsonLd);
        const catItem = breadcrumb.itemListElement.find(i => i.position === 3);
        if (catItem) category = catItem.name || '';
      }
    } catch {}

    const requirements = schema.operatingSystem || '';

    let downloadLink = '';
    $('a').each((_, el) => {
      const a = $(el);
      const href = a.attr('href');
      const text = a.text().toLowerCase();
      if (href && text.includes('download')) {
        downloadLink = href.startsWith('http') ? href : new URL(href, url).href;
        return false;
      }
    });

    const deskripsi = schema.description || $('meta[name="description"]').attr('content') || '';

    return {
      judul,
      versi,
      size,
      rating,
      ratingCount,
      lastUpdate,
      developer,
      thumbnail,
      category,
      requirements,
      downloadLink,
      deskripsi
    };
  } catch (err) {
    throw new Error(`Gagal memproses URL: ${err.message}`);
  }
}

// Endpoint GET
app.get('/stalk/getmodsapk', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parameter "url" wajib diisi.' });

  try {
    const data = await DetailByPonta(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}