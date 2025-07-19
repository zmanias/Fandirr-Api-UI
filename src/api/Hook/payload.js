const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

module.exports = function(app) {
  
const SECRET = 'fandirr123';

// Gunakan raw parser untuk mendapatkan rawBody
app.use('/webhook', express.raw({ type: '*/*' }));

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(req.body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (err) {
    return false;
  }
}

app.post('/webhook', (req, res) => {
  if (!verifySignature(req)) {
    console.log('❌ Signature tidak valid!');
    return res.status(401).send('Invalid signature');
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch (err) {
    console.error('❌ Gagal parse JSON:', err);
    return res.status(400).send('Invalid JSON');
  }

  console.log('✅ Webhook valid diterima:', payload);

  // Jalankan git pull
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