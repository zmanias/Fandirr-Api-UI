const express = require('express');
const cors = require('cors');
const axios = require('axios');

module.exports = function(app) {

// Plugin Lara Translate langsung di sini
const lara = {
  api: {
    base: 'https://webapi.laratranslate.com',
    endpoint: '/translate',
  },

  headers: {
    authority: 'webapi.laratranslate.com',
    origin: 'https://lara.com',
    referer: 'https://lara.com/',
    'user-agent': 'Postify/1.0.0',
  },

  instructions: {
    Faithful: [],
    Fluid: [
      'Translate this text with a focus on enhancing fluidity and readability.',
    ],
    Creative: [
      'Transform this text by infusing creativity and emotion, keeping the core meaning.',
    ],
  },

  translate: async (text, target, source = '', mode = 'Faithful', kastem = []) => {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        code: 400,
        result: { error: 'Teks source wajib diisi bree, kagak boleh kosong 🫵🏻' },
      };
    }
    if (!target || typeof target !== 'string' || target.trim() === '') {
      return {
        success: false,
        code: 400,
        result: { error: 'Bahasa target wajib diisi bree, kagak boleh kosong 🫵🏻' },
      };
    }

    const md = ['Faithful', 'Fluid', 'Creative', 'Custom'];
    if (!mode || !md.includes(mode)) {
      return {
        success: false,
        code: 400,
        result: {
          error: `Mode translate wajib diisi bree.. contoh: ${md.join(', ')}`
        },
      };
    }

    if (mode === 'Custom' && (!Array.isArray(kastem) || kastem.length === 0)) {
      return {
        success: false,
        code: 400,
        result: {
          error: 'Mode Custom butuh instructions dalam bentuk array.',
        },
      };
    }

    try {
      const instructions = mode === 'Custom' ? kastem : lara.instructions[mode];

      const datax = {
        q: text,
        source,
        target,
        instructions,
      };

      const response = await axios.post(
        `${lara.api.base}${lara.api.endpoint}`,
        datax,
        { headers: lara.headers }
      );

      const { data } = response;

      if (data.status !== 200) {
        return {
          success: false,
          code: data.status,
          result: { error: 'Gagal dari server Lara' },
        };
      }

      const { source_language: sourceLang, translation, quota } = data.content;

      return {
        success: true,
        code: 200,
        result: {
          mode,
          originalText: text,
          sourceLang,
          targetLang: target,
          translation,
          quota,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: error.response?.status || 500,
        result: { error: error.message || 'Terjadi kesalahan' },
      };
    }
  },
};

// Endpoint API GET
app.get('/tools/translate-lara', async (req, res) => {
  const { text, target, source = '', mode = 'Faithful', kastem } = req.query;

  let customInstructions = [];
  if (mode === 'Custom') {
    try {
      customInstructions = JSON.parse(kastem || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'kastem harus berupa JSON array string' });
    }
  }

  try {
    const result = await lara.translate(text, target, source, mode, customInstructions);
    res.status(result.code).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});
}