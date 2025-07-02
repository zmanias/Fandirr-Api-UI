const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// GET /api/phone-lookup?num=+628123456789&numverify_key=YOUR_NUMVERIFY_KEY&proxycurl_key=YOUR_PROXYCURL_KEY
app.get('/tools/lacaknomer', async (req, res) => {
  const { num: phone, numverify_key, proxycurl_key } = req.query;

  if (!phone || !numverify_key) {
    return res.status(400).json({ error: 'Parameter "num" dan "numverify_key" wajib diisi' });
  }

  try {
    // 1️⃣ Validasi via Numverify
    const nv = await axios.get('http://apilayer.net/api/validate', {
      params: { access_key: numverify_key, number: phone }
    });
    const numInfo = nv.data;

    // 2️⃣ (Opsional) Lookup balik via Proxycurl
    let reverse = null;
    if (proxycurl_key) {
      try { //https://enrichlayer.com/
        const pc = await axios.get('https://nubela.co/proxycurl/api/resolve/phone', {
          params: { phone_number: phone },
          headers: { Authorization: `Bearer ${proxycurl_key}` }
        });
        reverse = pc.data;
      } catch {}
    }

    // Gabungkan hasil
    res.json({ phone, valid: numInfo.valid, numInfo, reverse });
  } catch (err) {
    res.status(500).json({
      error: 'Gagal memproses lookup',
      detail: err.response?.data || err.message
    });
  }
});
}