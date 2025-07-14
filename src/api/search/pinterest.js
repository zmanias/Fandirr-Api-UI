require('dotenv').config(); // Memuat variabel dari file .env
const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// Endpoint utama untuk pencarian
app.get('/search/pin', async (req, res) => {
  // 1. Ambil query pencarian dari request URL (misal: /api/search?q=cat)
  const searchQuery = req.query.q;

  // Validasi: pastikan query tidak kosong
  if (!searchQuery) {
    return res.status(400).json({ 
      error: 'Parameter "q" (query) tidak boleh kosong.' 
    });
  }

  // 2. Siapkan detail untuk permintaan ke API Pinterest
  const pinterestApiUrl = 'https://api.pinterest.com/v5/search/pins';
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;

  // Validasi: pastikan Access Token sudah diatur di .env
  if (!accessToken || accessToken === "pina_AMAUMRYXAC3YIBAAGBAE2DQPYCFARGABQBIQDISOEIU7RZRUNH2NTAUA6KEWCROWSIXZ2UG72I7SMXBBSZ3A2GBGEF3JIMAA") {
    return res.status(500).json({
      error: 'Pinterest Access Token belum diatur di file .env'
    });
  }

  try {
    // 3. Kirim permintaan ke Pinterest menggunakan axios
    console.log(`Meneruskan pencarian ke Pinterest untuk: "${searchQuery}"`);
    const response = await axios.get(pinterestApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        'query': searchQuery,
        'limit': 10 // Ambil maksimal 10 gambar
      }
    });

    // 4. Olah hasil dari Pinterest untuk membuatnya lebih sederhana
    const pins = response.data.items;
    const simplifiedResults = pins.map(pin => ({
      id: pin.id,
      description: pin.title,
      // Ambil URL gambar dengan kualitas terbaik atau yang spesifik
      image_url: pin.media.images['1200x']?.url || pin.media.images.original.url, 
      pinterest_url: pin.link
    }));

    // 5. Kirim hasil yang sudah disederhanakan sebagai respons
    res.status(200).json(simplifiedResults);

  } catch (error) {
    console.error("Error saat menghubungi API Pinterest:", error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat mengambil data dari Pinterest.' 
    });
  }
});
}