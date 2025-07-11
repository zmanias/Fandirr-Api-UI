const express = require('express');
const axios = require('axios');
const cors = require('cors');

module.exports = function(app) {

/**
 * Ambil gambar Pinterest via JSON resource internal.
 * Memanggil endpoint JSON hidden milik Pinterest.
 */
async function pinterestSearch(query, max = 20) {
  const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=/search/pins/&data=${encodeURIComponent(JSON.stringify({
    options: {query, layout: "default", page_size: max},
    context: {}
  }))}`;

  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });

  const raw = res.data.resource_response?.data || [];
  return raw.map(pin => {
    const orig = pin.images?.orig?.url;
    return {
      image: orig || '',
      alt: pin.title || pin.description || '',
      link: pin.link ? `https://www.pinterest.com${pin.link}` : ''
    };
  });
}

app.get('/search/pin', async (req, res) => {
  const { query, limit = 20 } = req.query;
  if (!query) return res.status(400).json({ status: false, message: 'Parameter query wajib diisi' });

  try {
    const result = await pinterestSearch(query, Number(limit));
    res.json({ status: true, total: result.length, results: result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: false, message: 'Gagal mengambil data', error: err.message });
  }
});
}