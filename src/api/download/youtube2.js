const express   = require('express');
const axios     = require('axios');
const FormData  = require('form-data');
const cors      = require('cors');

module.exports = function(app) {

/* --------------------------------------------------------------
   Core function: ytdl
----------------------------------------------------------------*/
async function ytdl(url, reqFormat = 'best') {
  const form = new FormData();
  form.append('url', url);

  const headers = {
    ...form.getHeaders(),
    origin:  'https://www.videodowns.com',
    referer: 'https://www.videodowns.com/youtube-video-downloader.php',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
  };

  const { data } = await axios.post(
    'https://www.videodowns.com/youtube-video-downloader.php?action=get_info',
    form,
    { headers }
  );

  if (!data.success || !data.formats) throw new Error('Gagal mengambil data video.');

  const formats    = data.formats;
  const formatMap  = { best: 'best', '720p': 'medium', '480p': 'low', mp3: 'audio' };
  const key        = formatMap[(reqFormat || '').toLowerCase()] || 'best';
  const selected   = formats[key];

  if (!selected || !selected.ext) throw new Error(`Format "${reqFormat}" tidak tersedia.`);

  const info        = data.info;
  const downloadURL = `https://www.videodowns.com/youtube-video-downloader.php` +
                      `?download=1&url=${encodeURIComponent(url)}&format=${key}`;

  return {
    title      : info.title || 'Video',
    thumbnail  : data.thumbnail,
    sanitized  : data.sanitized,
    format     : key,
    ext        : selected.ext || 'mp4',
    url        : downloadURL,
    allFormats : formats,
    channel    : info.channel || info.author || 'Tidak diketahui',
    views      : info.view_count || 0
  };
}

/* --------------------------------------------------------------
   Endpoint:  GET /api/ytdl?url=...&format=best
----------------------------------------------------------------*/
app.get('/download/youtube2', async (req, res) => {
  const { url, format = 'best' } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: 'Parameter url wajib diisi.'
    });
  }

  try {
    const result = await ytdl(url, format);
    res.json({ status: true, ...result });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || err
    });
  }
});
}