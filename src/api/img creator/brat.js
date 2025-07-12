// ───────────────────────────── server.js ─────────────────────────────
const express    = require('express');
const cors       = require('cors');
const { createCanvas, registerFont } = require('canvas');
const GIFEncoder = require('gifencoder');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

// Daftarkan font lokal (sesuaikan path bila perlu)
try {
  registerFont(path.join(__dirname, 'arial.ttf'), { family: 'Arial' });
} catch (e) {
  console.error('⚠️  Tidak menemukan arial.ttf – pakai default font Canvas.');
}

// ────────────────── Fungsi Font Dinamis + Word Wrap ──────────────────
async function generateCanvasImage(text, { width = 500, height = 500, padding = 25 } = {}) {
  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let fontSize = 150;              // mulai besar
  let lines;

  do {
    ctx.font = `${fontSize}px Arial`;
    const lh   = fontSize * 1.2;
    const maxW = width - padding * 2;

    const words = text.split(' ');
    let curr = '';
    lines = [];

    for (const w of words) {
      const test = curr + w + ' ';
      if (ctx.measureText(test).width > maxW && curr) {
        lines.push(curr.trim());
        curr = w + ' ';
      } else curr = test;
    }
    lines.push(curr.trim());

    if (lines.length * lh > height - padding * 2) fontSize -= 5;
    else break;
  } while (fontSize > 10);

  const lh = fontSize * 1.2;
  ctx.font = `${fontSize}px Arial`;

  lines.forEach((ln, i) => ctx.fillText(ln, padding, padding + i * lh));

  return { canvas, buffer: canvas.toBuffer('image/png') };
}

// ────────────────────── ENDPOINT PNG  (/brat) ────────────────────────
app.get('/imgcreator/brat', async (req, res) => {
  try {
    const text = (req.query.text || 'hallo').trim();
    const { buffer } = await generateCanvasImage(text);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ────────────────────── ENDPOINT GIF (/bratvid) ──────────────────────
app.get('/imgcreator/bratvid', async (req, res) => {
  try {
    const text = (req.query.text || 'hallo').trim();
    if (!text) return res.status(400).json({ error: 'Parameter text wajib diisi' });

    // Siapkan canvas untuk setiap frame
    const base = await generateCanvasImage(text);
    const w = base.canvas.width;
    const h = base.canvas.height;

    const encoder = new GIFEncoder(w, h);
    encoder.start();
    encoder.setRepeat(0);   // 0 = loop selamanya
    encoder.setQuality(10);

    const ctx = base.canvas.getContext('2d');

    const words = text.split(/\s+/);

    if (words.length === 1) {
      encoder.setDelay(0);
      encoder.addFrame(ctx);          // 1 frame statis
    } else {
      encoder.setDelay(500);          // 500 ms tiap frame

      // Frame-1 → kata pertama
      await drawLine(ctx, words[0]);
      encoder.addFrame(ctx);

      // Frame-2 → kalimat penuh
      await drawLine(ctx, text);
      encoder.addFrame(ctx);
    }

    encoder.finish();
    res.setHeader('Content-Type', 'image/gif');
    res.end(encoder.out.getData(), 'binary');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fungsi helper menggambar ulang teks pada context
async function drawLine(ctx, text) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  // ulangi logika word-wrap agar frame-1/2 tetap proporsional
  await generateCanvasImage(text, { width, height });
  // generateCanvasImage menggambar langsung pada context global (karena share canvas)
}

app.use((_, res) => res.status(404).json({ error: 'Endpoint not found' }));

app.listen(PORT, () => {
  console.log(`🚀 Image Creator API running on http://localhost:${PORT}`);
});