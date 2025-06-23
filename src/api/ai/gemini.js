const express = require('express');
const axios = require('axios');

module.exports = function(app) {

const GEMINI_API_KEY = 'AIzaSyAG1wIhfHreufPqO6Jg5Z6e1E8xZAVhg4w'; // Ganti dengan API key Gemini kamu

// Mapping model pilihan
const modelMap = {
  pro: 'gemini-2.5-pro',
  flash: 'gemini-2.5-flash',
  'pro-preview': 'gemini-2.5-pro-preview-05-06',
};

app.get('/ai/gemini', async (req, res) => {
  const { prompt, model } = req.query;

  if (!prompt || !model) {
    return res.status(400).json({
      error: 'Parameter "prompt" dan "model" wajib diisi',
      available_models: Object.keys(modelMap),
    });
  }

  const modelId = modelMap[model];
  if (!modelId) {
    return res.status(400).json({
      error: `Model tidak valid. Gunakan salah satu dari: ${Object.keys(modelMap).join(', ')}`,
    });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada hasil.';
    res.json({
      model: modelId,
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
}