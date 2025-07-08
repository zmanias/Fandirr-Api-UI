const express = require('express');
const axios = require('axios');

module.exports = function(app) {

const GEMINI_API_KEY = 'AIzaSyAG1wIhfHreufPqO6Jg5Z6e1E8xZAVhg4w'; // Ganti dengan API KEY kamu

app.get('/ai/gemini', async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({ error: 'Parameter "prompt" wajib diisi' });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada hasil.';
    res.json({ prompt, result });

  } catch (err) {
    res.status(500).json({
      error: 'Terjadi kesalahan saat menghubungi Gemini API',
      detail: err.message,
    });
  }
});
}