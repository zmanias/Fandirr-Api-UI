// Impor library yang dibutuhkan
const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// ⬇️ Letakkan token Anda langsung di sini ⬇️
// PERINGATAN: Tidak disarankan untuk aplikasi produksi!
const PINTEREST_ACCESS_TOKEN = "pina_AMAZKRYXAC3YIBAAGBAE2DSJSPRQRGABQBIQCK7BQBJ2J6WQMIF5IL5D2P5K7VFIVM75O4JTO3NAC4NPFUAKRDQOWDTSCEYA";

// Middleware untuk membaca body request dalam format JSON
app.use(express.json());

// Endpoint utama untuk pencarian
app.get('/search/pin', async (req, res) => {
  const searchQuery = req.query.q;

  if (!searchQuery) {
    return res.status(400).json({ error: 'Parameter "q" (query) tidak boleh kosong.' });
  }
  
  // Validasi sederhana untuk memastikan token sudah diisi
  if (!PINTEREST_ACCESS_TOKEN || PINTEREST_ACCESS_TOKEN === "PASTE_YOUR_ACCESS_TOKEN_HERE") {
    return res.status(500).json({
      error: 'Pinterest Access Token belum diatur di dalam variabel.'
    });
  }

  try {
    console.log(`Meneruskan pencarian ke Pinterest untuk: "${searchQuery}"`);
    
    const response = await axios.get('https://api.pinterest.com/v5/search/pins', {
      headers: {
        // Gunakan variabel token yang sudah didefinisikan di atas
        'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`
      },
      params: {
        'query': searchQuery,
        'limit': 10
      }
    });

    // Olah hasil untuk disajikan ke pengguna
    const pins = response.data.items;
    const simplifiedResults = pins.map(pin => ({
      id: pin.id,
      description: pin.title,
      image_url: pin.media.images['1200x']?.url || pin.media.images.original.url,
      pinterest_url: pin.link
    }));

    res.status(200).json(simplifiedResults);

  } catch (error) {
    console.error("Error saat menghubungi API Pinterest:", error.response?.data || error.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data dari Pinterest.' });
  }
});
}