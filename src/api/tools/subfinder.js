const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

module.exports = function(app, validateApiKey) {

app.get('/tools/subfinder', (req, res, validateApiKey) => {
  const domain = req.query.domain;

  if (!domain) {
    return res.status(400).json({ error: 'Parameter "domain" harus diisi.' });
  }

  exec(`subfinder -d ${domain} -silent`, (error, stdout, stderr) => {
    if (error) {
      console.error('Subfinder error:', error.message);
      return res.status(500).json({ error: 'Gagal menjalankan subfinder', detail: error.message });
    }

    if (stderr) {
      console.error('stderr:', stderr);
    }

    const subdomains = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    res.json({ domain, subdomains });
  });
});
}