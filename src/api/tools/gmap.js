const express = require('express');

module.exports = function(app) {

app.get('/tools/gmap', (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Parameter lat dan lon diperlukan.' });
  }

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
  res.json({ mapsUrl });
});
}