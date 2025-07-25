const express = require('express');
const fs = require('fs');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

module.exports = function(app) {

app.get('/api/convert', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ status: false, message: 'Parameter "url" wajib diisi.' });
  }

  const m4aPath = path.join(__dirname, 'temp_input.m4a');
  const mp3Path = path.join(__dirname, 'output.mp3');

  try {
    // Download file .m4a
    const response = await axios.get(url, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(m4aPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Konversi ke .mp3 menggunakan ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-i', m4aPath, '-vn', '-ab', '192k', '-ar', '44100', '-y', mp3Path]);
      ffmpeg.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error('ffmpeg conversion failed'));
      });
    });

    // Kirim file mp3 ke response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename=output.mp3'
    });

    fs.createReadStream(mp3Path).pipe(res).on('close', () => {
      // Bersihkan file setelah dikirim
      fs.unlinkSync(m4aPath);
      fs.unlinkSync(mp3Path);
    });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ status: false, message: 'Terjadi kesalahan saat mengkonversi.' });
  }
});
}