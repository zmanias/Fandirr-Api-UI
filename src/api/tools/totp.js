const express = require('express');
const { authenticator } = require('otplib');

module.exports = function(app) {

// Endpoint untuk generate secret
app.get('/api/totp/secret', (req, res) => {
  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri('user@example.com', 'MyApp', secret);

  res.json({
    secret,
    otpAuthUrl,
    note: 'Gunakan secret ini untuk generate kode OTP atau simpan untuk otentikasi.'
  });
});

// Endpoint generate kode TOTP
app.get('/tools/a2f/generate', (req, res) => {
  const { secret } = req.query;
  if (!secret) return res.status(400).json({ error: 'Parameter secret diperlukan' });

  try {
    const token = authenticator.generate(secret);
    res.json({ kode });
  } catch (err) {
    res.status(500).json({ error: 'Gagal generate token', detail: err.message });
  }
});

// Endpoint verifikasi kode OTP
app.get('/api/totp/verify', (req, res) => {
  const { secret, token } = req.query;
  if (!secret || !token) return res.status(400).json({ error: 'Parameter secret dan token diperlukan' });

  const isValid = authenticator.check(token, secret);
  res.json({ valid: isValid });
});
}