const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// Ganti dengan API key Gemini kamu
const GEMINI_API_KEY = 'AIzaSyAG1wIhfHreufPqO6Jg5Z6e1E8xZAVhg4w';

// Pemetaan alias ke model asli
const modelMap = {
  pro: 'gemini-2.5-pro',
  flash: 'gemini-2.5-flash',
  'pro-preview': 'gemini-2.5-pro-preview-05-06',
};

app.get('/api/gemini-simulate', async (req, res) => {
  const { prompt, model } = req.query;

  if (!prompt || !model) {
    return res.status(400).json({
      error: 'Parameter "prompt" dan "model" wajib diisi.',
      options: Object.keys(modelMap)
    });
  }

  const modelId = modelMap[model];
  if (!modelId) {
    return res.status(400).json({
      error: `Model tidak valid. Pilih dari: ${Object.keys(modelMap).join(', ')}`,
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${GEMINI_API_KEY}`;

  // Simulasi riwayat percakapan seperti di GAS
  const contents = [
    {
      role: 'user',
      parts: [{ text: 'Hallo' }]
    },
    {
      role: 'model',
      parts: [
        { text: '**Assessing User Intent**\n\nSaya mengerti bahwa input "Hallo" adalah sapaan.' },
        { text: 'Hallo! Wie kann ich Ihnen helfen?' }
      ]
    },
    {
      role: 'user',
      parts: [{ text: 'Hallo' }]
    },
    {
      role: 'model',
      parts: [
        { text: '**Refining the Approach**\n\nSaya melihat pengguna mengulang sapaan.' },
        { text: 'Hallo! Ada yang bisa saya bantu hari ini?' }
      ]
    },
    {
      role: 'user',
      parts: [{ text: prompt }]
    }
  ];

  const payload = {
    contents,
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: 'text/plain'
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'stream'
    });

    let result = '';
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const clean = line.replace('data: ', '').trim();
          if (clean && clean !== '[DONE]') {
            try {
              const obj = JSON.parse(clean);
              const content = obj.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) result += content;
            } catch (e) {}
          }
        }
      }
    });

    response.data.on('end', () => {
      res.json({
        model: modelId,
        input: prompt,
        response: result.trim()
      });
    });

  } catch (err) {
    res.status(500).json({
      error: 'Gagal menghubungi API Gemini',
      detail: err.response?.data || err.message,
    });
  }
});
}