// server.js
const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const GIFEncoder = require('gifencoder');
const path = require('path');
const cors = require('cors');

module.exports = function (app) {
  app.use(cors());

  // Daftarkan font (pastikan arial.ttf ada di folder yang sama)
  try {
    registerFont(path.join(__dirname, 'arial.ttf'), { family: 'Arial' });
  } catch (e) {
    console.error('Gagal memuat font arial.ttf');
  }

  /* ================================================================
     ENDPOINT 1 – PNG (brat) – tetap seperti sebelumnya
  ================================================================ */
  app.get('/imgcreator/brat', (req, res) => {
    generateCanvasImage(req.query.text || 'hallo').then(({ buffer }) => {
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    }).catch(err => res.status(500).json({ error: err.message }));
  });

  /* ================================================================
     ENDPOINT 2 – GIF (bratvid)
  ================================================================ */
  app.get('/imgcreator/bratvid', async (req, res) => {
    try {
      const { canvas } = await generateCanvasImage(req.query.text || 'hallo');

      // --- Buat encoder GIF satu-frame ---
      const width  = canvas.width;
      const height = canvas.height;
      const encoder = new GIFEncoder(width, height);
      encoder.start();
      encoder.setRepeat(0);   // 0 = loop selamanya
      encoder.setDelay(0);    // tanpa delay → 1 frame statis
      encoder.setQuality(10); // 1 = terbaik, 20 = terburuk

      encoder.addFrame(canvas.getContext('2d'));
      encoder.finish();

      res.setHeader('Content-Type', 'image/gif');
      res.end(encoder.out.getData(), 'binary');
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ================================================================
     FUNGSI UTAMA – Membuat canvas & buffer dengan font dinamis
  ================================================================ */
  async function generateCanvasImage(text) {
    const width  = 500;
    const height = 500;
    const padding = 25;

    const canvas  = createCanvas(width, height);
    const ctx     = canvas.getContext('2d');

    // Latar putih
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // ---------------- Font dinamis & word-wrap ----------------
    let fontSize = 150;
    let lines;
    do {
      ctx.font = `${fontSize}px Arial`;

      const lineHeight = fontSize * 1.2;
      const maxWidth   = width - padding * 2;
      const words      = text.split(' ');
      let currentLine  = '';
      lines = [];

      for (const word of words) {
        const testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine.trim());

      const totalHeight = lines.length * lineHeight;
      if (totalHeight > height - padding * 2) fontSize -= 5;
      else break;
    } while (fontSize > 10);

    // ---------------- Gambar teks final ----------------
    const lineHeight = fontSize * 1.2;
    ctx.font = `${fontSize}px Arial`;

    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight);
    });

    const buffer = canvas.toBuffer('image/png');
    return { canvas, buffer };
  }
};