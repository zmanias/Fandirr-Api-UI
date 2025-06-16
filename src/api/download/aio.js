const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const fetch = require('node-fetch'); // pastikan sudah install: npm i node-fetch@2

module.exports = function(app) {

const rednoteDownloader = {
  getToken: async function () {
    const req = await fetch("https://anydownloader.com/en/xiaohongshu-videos-and-photos-downloader");
    if (!req.ok) return null;

    const res = await req.text();
    const $ = cheerio.load(res);
    const token = $("#token").val();

    return { token };
  },

  calculateHash: function (url, salt) {
    return Buffer.from(url).toString('base64') + (url.length + 1000) + Buffer.from(salt).toString('base64');
  },

  download: async function (url) {
    const conf = await rednoteDownloader.getToken();
    if (!conf) return { error: "Gagal mendapatkan token dari web.", result: {} };

    const { token } = conf;
    const hash = rednoteDownloader.calculateHash(url, "aio-dl");

    const data = new URLSearchParams();
    data.append('url', url);
    data.append('token', token);
    data.append('hash', hash);

    const req = await fetch("https://anydownloader.com/wp-json/aio-dl/video-data/", {
      method: "POST",
      headers: {
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
        "Referer": "https://anydownloader.com/en/xiaohongshu-videos-and-photos-downloader",
        "Origin": "https://anydownloader.com",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: data
    });

    if (!req.ok) return { error: "Terjadi kesalahan saat melakukan request", result: {} };

    let json;
    try {
      json = await req.json();
    } catch (e) {
      console.error(e);
      return { error: e.message, result: {} };
    }

    return {
      input_url: url,
      source: json.source,
      result: {
        title: json.title,
        duration: json.duration,
        thumbnail: json.thumbnail,
        downloadUrls: json.medias
      },
      error: null
    };
  }
};

// ========== API Endpoint ==========
app.get('/download/aio', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parameter "url" diperlukan' });

  try {
    const result = await rednoteDownloader.download(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}