const express = require('express');
const axios = require('axios');

module.exports = function(app) {
/**
 * Fungsi inti untuk mendapatkan media dari Threads.
 * Dimodifikasi agar melempar error dan mengembalikan data.
 * @param {string} threadsUrl - URL postingan Threads
 * @returns {Promise<object>} Objek berisi link video dan gambar
 */
const getThreadsMedia = async (threadsUrl) => {
  const api = 'https://api.threadsphotodownloader.com/v2/media';

  try {
    const response = await axios.get(api, {
      params: { url: threadsUrl },
      headers: {
        'Origin': 'https://sssthreads.pro',
        'Referer': 'https://sssthreads.pro/',
        'User-Agent': 'Mozilla/5.0',
      }
    });

    const { video_urls = [], image_urls = [] } = response.data;

    if (video_urls.length === 0 && image_urls.length === 0) {
      throw new Error('Tidak ada media yang ditemukan di URL tersebut atau URL tidak valid.');
    }

    // Kembalikan data dalam bentuk objek
    return {
      videos: video_urls.map(item => item.download_url),
      images: image_urls
    };

  } catch (err) {
    // Lempar error untuk ditangkap oleh route handler Express
    const errorMessage = err.response?.data?.error || err.message;
    throw new Error(errorMessage);
  }
};

// Membuat endpoint GET /threads
app.get('/download/threads', async (req, res) => {
  const { url } = req.query;

  // Validasi input
  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'Query parameter "url" wajib diisi.'
    });
  }

  try {
    const mediaData = await getThreadsMedia(url);
    res.json({
      status: 'success',
      data: mediaData
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
}