const express = require('express');
const axios = require('axios');
const cors = require('cors');

module.exports = function(app) {

const GEMINI_API_KEY = 'AIzaSyAG1wIhfHreufPqO6Jg5Z6e1E8xZAVhg4w';

app.post('/ai/gemini', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada hasil';
    res.json({ prompt, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memproses permintaan Gemini', detail: error.message });
  }
});
}