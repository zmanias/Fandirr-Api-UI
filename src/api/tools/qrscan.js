const express = require('express');
const axios = require('axios');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');

module.exports = function(app) {

app.get('/tools/qrscan', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Parameter ?url= wajib diisi' });
  }

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const image = await Jimp.read(Buffer.from(response.data));

    const qr = new QrCode();
    qr.callback = function (err, value) {
      if (err || !value) {
        return res.status(400).json({ error: 'Gagal membaca kode QR' });
      }
      return res.json({ result: value.result });
    };

    qr.decode(image.bitmap);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan', detail: error.message });
  }
});
}