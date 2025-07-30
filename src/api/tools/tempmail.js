const express = require('express');
const axios = require('axios');

module.exports = function(app) {

const API_BASE = 'https://api.tempmail.lol';
const HEADERS = { 'User-Agent': 'NB Android/1.0.0' };

/**
 * Membuat alamat email sementara baru.
 * @param {string} [prefix] - Awalan kustom untuk alamat email.
 */
async function createTempMail(prefix = null) {
  try {
    const payload = { domain: null, captcha: null };
    if (prefix) payload.prefix = prefix;

    const { data } = await axios.post(`${API_BASE}/v2/inbox/create`, payload, { headers: HEADERS });

    const createdAt = new Date();
    // Email berlaku selama 1 jam (60 menit)
    const expiresAt = new Date(createdAt.getTime() + (60 * 60 * 1000));

    return {
      success: true,
      code: 200,
      result: { address: data.address, token: data.token, expiresAt: expiresAt.toISOString() }
    };
  } catch (error) {
    return {
      success: false,
      code: error?.response?.status || 500,
      result: { error: error.message }
    };
  }
}

/**
 * Mengecek inbox dengan polling dan timeout.
 * @param {string} token - Token inbox dari createTempMail.
 * @param {Date} expiresAt - Waktu kedaluwarsa token.
 * @param {number} [timeout=60] - Batas waktu polling dalam detik.
 */
async function checkInbox(token, expiresAt, timeout = 60) {
  const startTime = Date.now();
  
  if (!token) {
      return { success: false, code: 400, result: { error: 'Token tidak valid.' } };
  }

  while (true) {
    // Cek jika waktu polling melebihi timeout
    if ((Date.now() - startTime) > (timeout * 1000)) {
        return { success: false, code: 408, result: { error: `Tidak ada email masuk setelah ${timeout} detik.` } };
    }
    // Cek jika token sudah kedaluwarsa
    if (new Date() > expiresAt) {
      return { success: false, code: 410, result: { error: 'Token email sudah kedaluwarsa.' } };
    }

    try {
        const { data } = await axios.get(`${API_BASE}/v2/inbox?token=${token}`, { headers: HEADERS });
        
        if (data.emails?.length > 0) {
          const emails = data.emails.map(e => ({
            id: e.id || e._id, from: e.from, to: e.to, subject: e.subject,
            body: e.body, createdAt: e.createdAt, attachments: e.attachments || []
          }));
          return { success: true, code: 200, result: { emails } };
        }
    } catch (error) {
        // Jika token tidak ditemukan oleh API
        if (error.response?.status === 404) {
            return { success: false, code: 404, result: { error: 'Token tidak ditemukan atau sudah expired.' } };
        }
    }
    
    // Tunggu 3 detik sebelum mencoba lagi
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

// === ENDPOINT API ===

// Endpoint untuk membuat email
app.get('/tempmail/create', async (req, res) => {
    const { prefix } = req.query;
    const result = await createTempMail(prefix);
    res.status(result.code).json(result);
});

// Endpoint untuk mengecek inbox
app.get('/tempmail/inbox', async (req, res) => {
    const { token, expiresAt, timeout } = req.query;

    if (!token || !expiresAt) {
        return res.status(400).json({ success: false, code: 400, result: { error: 'Query parameter "token" dan "expiresAt" wajib diisi.' } });
    }

    const result = await checkInbox(token, new Date(expiresAt), timeout);
    res.status(result.code).json(result);
});
}