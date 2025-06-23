const express = require('express');
const axios = require('axios');

module.exports = function(app) {

const GEMINI_API_KEY = 'AIzaSyAG1wIhfHreufPqO6Jg5Z6e1E8xZAVhg4w'; // Ganti dengan API key Gemini kamu
const MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-pro-preview-05-06'];

app.get('/ai/gemini', async (req, res) => {
  const { prompt, model } = req.query;

  if (!prompt || !model) {
    return res.status(400).json({
      error: 'Parameter "prompt" dan "model" wajib diisi',
      models: MODELS,
    });
  }

  if (!MODELS.includes(model)) {
    return res.status(400).json({
      error: `Model tidak valid. Gunakan salah satu dari: ${MODELS.join(', ')}`,
    });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada hasil.';
    res.json({
      model,
      prompt,
      result,
    });

  } catch (error) {
    res.status(500).json({
      error: 'Gagal mengambil respons dari Gemini API',
      detail: error.response?.data || error.message,
    });
  }
});
}