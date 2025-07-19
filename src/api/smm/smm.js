const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// Mengubah endpoint menjadi metode GET
app.get('/smm/cek-saldo', async (req, res) => {
  // Mengambil api_id dan api_key dari query parameter URL
  const { api_id, api_key } = req.query;

  // Validasi sederhana
  if (!api_id || !api_key) {
    return res.status(400).json({
      status: false,
      msg: 'Parameter api_id dan api_key wajib ada di URL.',
    });
  }

  // URL endpoint API eksternal
  const apiUrl = 'https://smmnusantara.id/api/balance';
  
  // Buat payload untuk dikirim ke API smmnusantara
  const payload = new URLSearchParams();
  payload.append('api_id', api_id);
  payload.append('api_key', api_key);

  try {
    // Permintaan ke API eksternal TETAP menggunakan POST
    const response = await axios.post(apiUrl, payload);
    res.json(response.data);

  } catch (error) {
    console.error("Terjadi error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: false,
        msg: 'Gagal terhubung ke server API eksternal.',
      });
    }
  }
});

app.get('/smm/daftar-layanan', async (req, res) => {

  // Mengambil api_id dan api_key dari query parameter URL
  const { api_id, api_key } = req.query;

  // Validasi sederhana
  if (!api_id || !api_key) {
    return res.status(400).json({
      status: false,
      msg: 'Parameter api_id dan api_key wajib ada di URL.',
    });
  }

  // URL endpoint API eksternal
  const apiUrl = 'https://smmnusantara.id/api/services';
  
  // Buat payload untuk dikirim ke API smmnusantara
  const payload = new URLSearchParams();
  payload.append('api_id', api_id);
  payload.append('api_key', api_key);

  try {
    // Permintaan ke API eksternal TETAP menggunakan POST
    const response = await axios.post(apiUrl, payload);
    res.json(response.data);

  } catch (error) {
    console.error("Terjadi error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: false,
        msg: 'Gagal terhubung ke server API eksternal.',
      });
    }
  }

});

// Endpoint BARU untuk membuat pesanan
app.get('/smm/buat-pesanan', async (req, res) => {
  // Mengambil semua parameter yang dibutuhkan dari query URL
  const { api_id, api_key, service, target, quantity } = req.query;

  // Validasi
  if (!api_id || !api_key || !service || !target || !quantity) {
    return res.status(400).json({
      status: false,
      msg: 'Semua parameter (api_id, api_key, service, target, quantity) wajib diisi.',
    });
  }

  // URL endpoint API eksternal
  const apiUrl = 'https://smmnusantara.id/api/order';
  
  // Buat payload dengan semua parameter
  const payload = new URLSearchParams();
  payload.append('api_id', api_id);
  payload.append('api_key', api_key);
  payload.append('service', service);
  payload.append('target', target);
  payload.append('quantity', quantity);

  try {
    // Permintaan ke API eksternal TETAP menggunakan POST
    const response = await axios.post(apiUrl, payload);
    res.json(response.data);

  } catch (error) {
    console.error("Terjadi error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: false,
        msg: 'Gagal terhubung ke server API eksternal.',
      });
    }
  }
});


// Endpoint BARU untuk cek status pesanan
app.get('/smm/cek-status', async (req, res) => {
  // Mengambil parameter dari query URL
  const { api_id, api_key, id } = req.query;

  // Validasi
  if (!api_id || !api_key || !id) {
    return res.status(400).json({
      status: false,
      msg: 'Parameter api_id, api_key, dan id (order id) wajib diisi.',
    });
  }

  // URL endpoint API eksternal
  const apiUrl = 'https://smmnusantara.id/api/status';
  
  // Buat payload dengan semua parameter
  const payload = new URLSearchParams();
  payload.append('api_id', api_id);
  payload.append('api_key', api_key);
  payload.append('id', id);

  try {
    // Permintaan ke API eksternal TETAP menggunakan POST
    const response = await axios.post(apiUrl, payload);
    res.json(response.data);

  } catch (error) {
    console.error("Terjadi error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: false,
        msg: 'Gagal terhubung ke server API eksternal.',
      });
    }
  }
});

// Endpoint BARU untuk meminta refill pesanan
app.get('/smm/minta-refill', async (req, res) => {
  // Mengambil parameter dari query URL
  const { api_id, api_key, id } = req.query;

  // Validasi
  if (!api_id || !api_key || !id) {
    return res.status(400).json({
      status: false,
      msg: 'Parameter api_id, api_key, dan id (order id) wajib diisi.',
    });
  }

  // URL endpoint API eksternal
  const apiUrl = 'https://smmnusantara.id/api/refill';
  
  // Buat payload dengan semua parameter
  const payload = new URLSearchParams();
  payload.append('api_id', api_id);
  payload.append('api_key', api_key);
  payload.append('id', id);

  try {
    // Permintaan ke API eksternal TETAP menggunakan POST
    const response = await axios.post(apiUrl, payload);
    res.json(response.data);

  } catch (error) {
    console.error("Terjadi error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: false,
        msg: 'Gagal terhubung ke server API eksternal.',
      });
    }
  }
});

// Endpoint BARU untuk cek status refill
app.get('/smm/status-refill', async (req, res) => {
  // Mengambil parameter dari query URL
  const { api_id, api_key, id } = req.query;

  // Validasi
  if (!api_id || !api_key || !id) {
    return res.status(400).json({
      status: false,
      msg: 'Parameter api_id, api_key, dan id (refill id) wajib diisi.',
    });
  }

  // URL endpoint API eksternal
  const apiUrl = 'https://smmnusantara.id/api/refill/status';
  
  // Buat payload dengan semua parameter
  const payload = new URLSearchParams();
  payload.append('api_id', api_id);
  payload.append('api_key', api_key);
  payload.append('id', id);

  try {
    // Permintaan ke API eksternal TETAP menggunakan POST
    const response = await axios.post(apiUrl, payload);
    res.json(response.data);

  } catch (error) {
    console.error("Terjadi error:", error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        status: false,
        msg: 'Gagal terhubung ke server API eksternal.',
      });
    }
  }
});
}