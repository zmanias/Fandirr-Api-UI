const express = require('express');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

module.exports = function(app) {

const DOMAIN = 'https://api.fandirr.my.id'; // Ganti dengan domain API-mu
const TEMP_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// 🔄 Convert endpoint
app.get('/convert/m4atomp3', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parameter ?url= dibutuhkan' });

  try {
    const randName = crypto.randomBytes(6).toString('hex');
    const m4aPath = path.join(TEMP_DIR, `input_${randName}.m4a`);
    const mp3Name = `${randName}.mp3`;
    const mp3Path = path.join(TEMP_DIR, mp3Name);

    // Download file
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(m4aPath);
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Convert to mp3
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-i', m4aPath, '-vn', '-ab', '192k', '-ar', '44100', '-y', mp3Path]);
      ffmpeg.on('close', code => (code === 0 ? resolve() : reject(new Error('Konversi gagal'))));
    });

    // Hapus input
    fs.unlinkSync(m4aPath);

    // Kirim response
    res.json({
      success: true,
      download: `${DOMAIN}/downloads/${mp3Name}`
    });

  } catch (err) {
    console.error('Gagal:', err.message);
    res.status(500).json({ error: 'Gagal konversi audio' });
  }
});

// 📂 Static download
app.use('/downloads', express.static(TEMP_DIR));

// 🧹 Auto hapus file > 1 hari
setInterval(() => {
  const now = Date.now();
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && (now - stats.mtimeMs) > 86400000) {
          fs.unlink(filePath, () => console.log(`🗑️ Dihapus: ${file}`));
        }
      });
    });
  });
}, 60 * 60 * 1000); // Tiap 1 jam
}