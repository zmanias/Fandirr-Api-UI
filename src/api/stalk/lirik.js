const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

  // Fungsi scraping lirik
  async function LyricsByPonta(query) {
    if (!query) throw new Error('Harap masukkan judul lagu atau artis.');

    const url = `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Referer': url
      },
      decompress: true
    });

    const $ = cheerio.load(response.data);
    const lyricDiv = $('.sec-lyric.clearfix').first();
    const lyricBody = lyricDiv.find('.lyric-body').text().trim();

    if (!lyricBody) throw new Error('Lirik tidak ditemukan.');

    return lyricBody;
  }

  // Endpoint API
  app.get('/stalk/lirik', async (req, res) => {
    const { q } = req.query;
    
    if (!q) return res.status(400).json({ error: 'Parameter "q" (judul lagu/artis) wajib diisi.' });

    try {
      const lyrics = await LyricsByPonta(q);
      res.json({ query: q, lyrics });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

};