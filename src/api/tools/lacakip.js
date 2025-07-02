const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// Endpoint lacak IP
app.get('/api/iplookup', async (req, res) => {
  const { ip } = req.query;
  if (!ip) return res.status(400).json({ error: 'Parameter "ip" diperlukan' });

  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const data = response.data;

    res.json({
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      country_code: data.country,
      postal: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      org: data.org,
      asn: data.asn,
      network: data.network,
      version: data.version
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal melacak IP', detail: error.message });
  }
});
}