const express = require('express');
const axios = require('axios');

module.exports = function(app, validateApiKey) {

// CREATE SUBDOMAIN
app.get('/cf/subdomain/create', async (req, res) => {
  const { token, zone, domain, name, ipvps } = req.query;
  if (!token || !zone || !domain || !name || !ipvps) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
      {
        type: 'A',
        name: `${name}.${domain}`,
        content: ipvps,
        ttl: 1,
        proxied: false
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIST SUBDOMAINS
app.get('/cf/subdomain/list', async (req, res) => {
  const { token, zone } = req.query;
  if (!token || !zone) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE SUBDOMAIN
app.get('/cf/subdomain/delete', async (req, res) => {
  const { token, zone, id } = req.query;
  if (!token || !zone || !id) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    const response = await axios.delete(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}