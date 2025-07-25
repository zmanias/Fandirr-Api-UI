const express = require('express');
const axios = require('axios');

module.exports = function(app) {
/**
 * Fungsi inti untuk mendapatkan transkrip dari URL TikTok.
 * Dimodifikasi agar melempar error (throw) untuk ditangkap oleh Express.
 * @param {string} videoUrl - URL video TikTok
 * @returns {Promise<object>} Objek berisi data transkrip
 */
const getTikTokTranscript = async (videoUrl) => {
  try {
    const res = await axios.post(
      'https://www.short.ai/self-api/v2/project/get-tiktok-youtube-link',
      { link: videoUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://www.short.ai',
          'Referer': 'https://www.short.ai/tiktok-script-generator',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/536.36'
        }
      }
    );

    const data = res.data?.data?.data;
    if (!data || !data.text) {
      throw new Error('Gagal mendapatkan transkrip dari respons API. Data mungkin kosong atau URL tidak valid.');
    }

    return {
      text: data.text,
      duration: data.duration,
      language: data.language,
      url: res.data?.data?.url,
      segments: data.segments.map(s => ({
        start: s.start,
        end: s.end,
        text: s.text
      }))
    };
  } catch (err) {
    // Melempar error agar bisa ditangani oleh block catch di route
    const errorMessage = err.response?.data?.message || err.message;
    throw new Error(errorMessage);
  }
};

// Membuat endpoint GET /transcript
app.get('/transcript/tt', async (req, res) => {
  const { url } = req.query;

  // Validasi input
  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'Query parameter "url" wajib diisi.'
    });
  }

  try {
    const transcriptData = await getTikTokTranscript(url);
    res.json({
      status: 'success',
      data: transcriptData
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
}