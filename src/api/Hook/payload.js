const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { exec } = require('child_process');

module.exports = function(app) {
const SECRET = 'fandirr123'; // ganti dengan secret kamu

// Middleware untuk menangkap raw body
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Fungsi validasi signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (err) {
    return false;
  }
}

// Endpoint Webhook
app.post('/webhook', (req, res) => {
  if (!verifySignature(req)) {
    console.log('❌ Signature tidak valid!');
    return res.status(401).send('Invalid signature');
  }

  console.log('✅ Webhook valid diterima:', req.body);

  // Eksekusi perintah git pull
  exec('git pull', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Gagal git pull:', stderr);
    } else {
      console.log('✅ Git Pull berhasil:\n', stdout);
    }
  });

  res.send('OK');
});
}