const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

module.exports = function(app) {

const config = {
  scales: ['2', '4'],
  types: { upscale: 13, enhance: 2, sharpener: 1 }
};

async function imglarger(buffer, options = {}) {
  const { scale = '2', type = 'upscale' } = options;

  if (!Buffer.isBuffer(buffer)) throw new Error('Image buffer is required');
  if (!config.types[type]) throw new Error(`Tipe tidak valid. Pilihan: ${Object.keys(config.types).join(', ')}`);
  if (type === 'upscale' && !config.scales.includes(scale.toString()))
    throw new Error(`Skala hanya boleh: ${config.scales.join(', ')}`);

  const form = new FormData();
  form.append('file', buffer, `imglarger_${Date.now()}.jpg`);
  form.append('type', config.types[type].toString());
  if (type !== 'sharpener') form.append('scaleRadio', type === 'upscale' ? scale.toString() : '1');

  const { data: uploadRes } = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', form, {
    headers: {
      ...form.getHeaders(),
      accept: 'application/json, text/plain, */*',
      origin: 'https://imglarger.com',
      referer: 'https://imglarger.com/',
      'user-agent': 'Mozilla/5.0'
    }
  });

  if (!uploadRes.data.code) throw new Error('Upload gagal - tidak ada kode diterima');

  while (true) {
    const { data: statusRes } = await axios.post(
      'https://photoai.imglarger.com/api/PhoAi/CheckStatus',
      {
        code: uploadRes.data.code,
        type: config.types[type]
      },
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          origin: 'https://imglarger.com',
          referer: 'https://imglarger.com/',
          'user-agent': 'Mozilla/5.0'
        }
      }
    );

    if (statusRes.data.status === 'waiting') continue;
    if (statusRes.data.status === 'success') return statusRes.data.downloadUrls[0];

    await new Promise(res => setTimeout(res, 5000));
  }
}

app.get('/imgcreator/imglarger', async (req, res) => {
  const { imageUrl, type = 'upscale', scale = '2' } = req.query;

  if (!imageUrl) return res.status(400).json({ error: 'Parameter imageUrl wajib diisi.' });

  try {
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageRes.data);

    const resultUrl = await imglarger(buffer, { type, scale });
    res.json({ success: true, result: resultUrl });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan saat proses.' });
  }
});
}