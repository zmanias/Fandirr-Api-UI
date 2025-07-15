const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const Buffer = require('buffer').Buffer;

module.exports = function(app) {

// ⚠️ Kunci API OpenAI Anda. SANGAT TIDAK AMAN!
const OPENAI_API_KEY = "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";

// Middleware untuk membaca request body JSON (dibutuhkan untuk metode POST)


/**
 * Fungsi inti untuk memproses editan gambar.
 * Fungsi ini akan dipanggil oleh endpoint GET dan POST.
 * @param {string} imageUrl - URL gambar yang akan diedit.
 * @param {string} prompt - Perintah untuk mengedit gambar.
 * @returns {Promise<string>} - Hasil gambar dalam format base64.
 */
async function handleImageEdit(imageUrl, prompt) {
  try {
    // 1. Unduh gambar dari URL
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    // 2. Siapkan form data untuk dikirim ke OpenAI
    const form = new FormData();
    form.append('image', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
    form.append('prompt', prompt);
    form.append('model', 'dall-e-2');
    form.append('n', '1');
    form.append('size', '1024x1024');
    form.append('response_format', 'b64_json');

    // 3. Kirim permintaan ke API OpenAI
    const response = await axios.post('https://api.openai.com/v1/images/edits', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    const base64 = response.data?.data?.[0]?.b64_json;
    if (!base64) {
      throw new Error('Tidak ada respons base64 dari API OpenAI.');
    }

    return base64; // Kembalikan hasil jika berhasil

  } catch (error) {
    // Lemparkan error agar bisa ditangkap oleh pemanggil
    console.error('Error di dalam handleImageEdit:', error.response ? error.response.data : error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data.error) : 'Gagal memproses gambar.');
  }
}

// Endpoint untuk metode GET
app.get('/openai/edit-image', async (req, res) => {
  const { imageUrl, prompt } = req.query; // Ambil dari query parameter

  if (!imageUrl || !prompt) {
    return res.status(400).json({ error: 'Parameter query "imageUrl" dan "prompt" tidak boleh kosong.' });
  }

  try {
    const base64Result = await handleImageEdit(imageUrl, prompt);
    res.status(200).json({ success: true, base64: base64Result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengedit gambar.', details: err.message });
  }
});

// Endpoint untuk metode POST
app.post('/edit-image', async (req, res) => {
  const { imageUrl, prompt } = req.body; // Ambil dari body JSON

  if (!imageUrl || !prompt) {
    return res.status(400).json({ error: 'Body JSON "imageUrl" dan "prompt" tidak boleh kosong.' });
  }

  try {
    const base64Result = await handleImageEdit(imageUrl, prompt);
    res.status(200).json({ success: true, base64: base64Result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengedit gambar.', details: err.message });
  }
});
}