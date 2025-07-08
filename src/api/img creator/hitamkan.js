const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// REST API endpoint - GET
app.get('/imgcreator/hitamkan', async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Parameter imageUrl wajib diisi.' });
  }

  try {
    const response = await axios.get(`https://zenzxz.dpdns.org/tools/hitamkan?imageUrl=${encodeURIComponent(imageUrl)}`, {
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan saat memproses gambar' });
  }
});
}