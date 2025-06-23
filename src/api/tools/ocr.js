const express = require('express');
const axios = require('axios');
const Tesseract = require('tesseract.js');

module.exports = function(app) {

app.get('/tools/ocr', async (req, res) => {
  const { img } = req.query;
  if (!img) return res.status(400).json({ error: 'Parameter ?img= harus disertakan.' });

  try {
    const response = await axios.get(img, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const result = await Tesseract.recognize(buffer, 'eng+ind', {
      logger: m => console.log(m) // log progress
    });

    const text = result.data.text.trim();

    if (!text) {
      return res.json({ status: 'success', message: 'Teks tidak terbaca dari gambar.' });
    }

    res.json({
      status: 'success',
      source: img,
      text
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Gagal membaca teks dari gambar',
      detail: err.message
    });
  }
});
}