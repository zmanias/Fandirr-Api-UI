const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

module.exports = function(app) {

// =======================================================
// FUNGSI INTI ANDA (Txt2IMG)
// =======================================================
const reso = {
  portrait: { width: 768, height: 1344 },
  landscape: { width: 1344, height: 768 },
  square: { width: 1024, height: 1024 },
  ultra: { width: 1536, height: 1536 },
  tall: { width: 832, height: 1344 },
  wide: { width: 1344, height: 832 },
};

async function Txt2IMG(prompt, resolusi = 'square', upscale = 2) {
  const selected = reso[resolusi] || reso.square;
  const { width, height } = selected;

  const promises = Array.from({ length: 3 }, (_, idx) => {
    const form = new FormData();
    form.append('Prompt', prompt);
    form.append('Language', 'eng_Latn');
    form.append('Size', `${width}x${height}`);
    form.append('Upscale', upscale.toString());
    form.append('Batch_Index', idx.toString());

    const agent = new https.Agent({ rejectUnauthorized: false });

    return axios.post(
      'https://api.zonerai.com/zoner-ai/txt2img',
      form,
      {
        httpsAgent: agent,
        headers: {
          ...form.getHeaders(),
          'Origin': 'https://zonerai.com',
          'Referer': 'https://zonerai.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36'
        },
        responseType: 'arraybuffer'
      }
    ).then(res => {
      const contentType = res.headers['content-type'] || 'image/jpeg';
      const fileId = res.headers['x-file-id'] || `zonerai-image-${Date.now()}-${idx + 1}`;
      const buffer = Buffer.from(res.data);
      return { buffer, contentType, fileId };
    });
  });

  try {
    return await Promise.all(promises);
  } catch (err) {
    const errorMessage = err.response?.data?.toString() || err.message;
    throw new Error('Gagal generate gambar: ' + errorMessage);
  }
}

// =======================================================
// ENDPOINT REST API (Diubah ke GET)
// =======================================================
app.get('/txt2img', async (req, res) => {
    // Ambil parameter dari query URL
  const { prompt, resolusi, upscale } = req.query;

  if (!prompt) {
    return res.status(400).json({
      status: 'error',
      message: 'Query parameter "prompt" wajib diisi.'
    });
  }

  try {
    const imageResults = await Txt2IMG(prompt, resolusi, upscale);

    const imagesInBase64 = imageResults.map(img => ({
      fileId: img.fileId,
      contentType: img.contentType,
      base64: img.buffer.toString('base64')
    }));

    res.json({
      status: 'success',
      images: imagesInBase64
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
}