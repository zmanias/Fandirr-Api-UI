import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

module.exports = function(app) {

// Fungsi utama untuk mengambil jadwal sholat
const jadwalSholat = {
  kota: async (kota) => {
    if (!kota) throw new Error("Query kota kosong.");

    try {
      const { data } = await axios.get(`https://www.umroh.com/jadwal-sholat/${kota}`);
      const $ = cheerio.load(data);
      const hasil = [];

      $('table tbody tr').each((_, el) => {
        const kolom = $(el).find('td');
        hasil.push({
          tanggal: $(kolom[0]).text().trim(),
          imsyak: $(kolom[1]).text().trim(),
          subuh: $(kolom[2]).text().trim(),
          dzuhur: $(kolom[3]).text().trim(),
          ashar: $(kolom[4]).text().trim(),
          maghrib: $(kolom[5]).text().trim(),
          isya: $(kolom[6]).text().trim(),
        });
      });

      return hasil;
    } catch (err) {
      throw new Error(`Gagal mengambil data: ${err.message}`);
    }
  }
};

// Endpoint API
app.get('/stalk/jadwalsholat', async (req, res) => {
  const { kota } = req.query;

  if (!kota) {
    return res.status(400).json({ error: 'Parameter kota diperlukan' });
  }

  try {
    const data = await jadwalSholat.kota(kota);
    res.json({ kota, jadwal: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}