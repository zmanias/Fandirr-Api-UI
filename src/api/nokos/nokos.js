const express = require('express');
const axios = require('axios');

module.exports = function(app) {

/**
 * Fungsi pembantu untuk memanggil API Virtusim.
 * Fungsi ini sekarang hanya meneruskan data yang diterima.
 * @param {object} queryData - Data yang akan dikirim ke Virtusim, harus sudah berisi api_key.
 * @returns {Promise<object>} - Hasil respons dari API Virtusim.
 */
async function callVirtusimAPI(queryData) {
  try {
    const formBody = new URLSearchParams(queryData).toString();
    const response = await axios.post('https://virtusim.com/api/v2/json.php', formBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'FandirrCoding-NodeJS/1.0',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error calling Virtusim API:', error.message);
    throw new Error('Gagal menghubungi API provider.');
  }
}

// Middleware untuk memeriksa API Key di semua request
const checkApiKey = (req, res, next) => {
  const { api_key } = req.query;
  if (!api_key) {
    return res.status(401).json({ status: 'error', message: 'Parameter "api_key" wajib diisi.' });
  }
  next(); // Lanjutkan ke handler jika api_key ada
};

// Terapkan middleware ke semua rute
app.use(checkApiKey);

// === Endpoint untuk API kita (API Key dari Pengguna) ===

// 1. Get Layanan
app.get('/nokos/services', async (req, res) => {
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'services' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Membuat Pesanan
app.get('/nokos/order', async (req, res) => {
  const { service, operator } = req.query;
  if (!service || !operator) {
    return res.status(400).json({ status: 'error', message: 'Parameter "service" dan "operator" wajib diisi.' });
  }

  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'order' });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. Get Pesanan Aktif
app.get('/nokos/orders/active', async (req, res) => {
    try {
        const data = await callVirtusimAPI({ ...req.query, action: 'active_order' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 4. Check Status Pesanan berdasarkan ID
app.get('/nokos/order/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'status', id });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. Mengubah Status Pesanan
app.get('/nokos/order/:id/set-status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  if (!status) {
    return res.status(400).json({ status: 'error', message: 'Parameter "status" wajib diisi.' });
  }

  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'set_status', id });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
}