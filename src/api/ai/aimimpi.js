const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports = function(app) {

/**
 * Fungsi inti untuk menganalisis mimpi.
 * @param {string} text - Teks mimpi yang akan dianalisis
 * @returns {Promise<string>} String berisi interpretasi mimpi
 */
async function dreamAnalyzer(text) {
  if (!text) throw new Error('Teks mimpi tidak boleh kosong.');

  try {
    const payload = {
      text,
      interpretationType: 'general',
      isPublic: true,
      userId: uuidv4(),
    };

    const res = await axios.post('https://dreammeaningai.com/interpret', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://dreammeaningai.com',
        'Referer': 'https://dreammeaningai.com/id',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (res?.data?.interpretation) {
      return res.data.interpretation;
    } else {
      throw new Error('Gagal mendapatkan interpretasi dari API.');
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    throw new Error(errorMessage);
  }
}

// Membuat endpoint GET /dream
app.get('/ai/mimpi', async (req, res) => {
  // Ambil parameter dari query URL
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({
      status: 'error',
      message: 'Query parameter "text" wajib diisi.'
    });
  }

  try {
    const interpretation = await dreamAnalyzer(text);
    res.json({
      status: 'success',
      interpretation: interpretation
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
}