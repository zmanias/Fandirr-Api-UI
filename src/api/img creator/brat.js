// ───────────────────────────── server.js ─────────────────────────────
const express    = require('express');
const cors       = require('cors');
const { createCanvas, registerFont } = require('canvas');
const GIFEncoder = require('gifencoder');
const path       = require('path');

module.exports = function (app) {

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

    const words = text.split(/\s+/);
    const width = 500;
    const height = 500;
    const padding = 25;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const encoder = new GIFEncoder(width, height);

    encoder.start();
    encoder.setRepeat(0); // loop forever
    encoder.setQuality(10);
    encoder.setDelay(600); // delay per frame in ms

    if (words.length === 1) {
      drawWrappedText(ctx, words[0], width, height, padding);
      encoder.addFrame(ctx);
    } else {
      // Frame 1: kata pertama
      drawWrappedText(ctx, words[0], width, height, padding);
      encoder.addFrame(ctx);

      // Frame 2: full kalimat
      drawWrappedText(ctx, text, width, height, padding);
      encoder.addFrame(ctx);
    }

    encoder.finish();
    res.setHeader('Content-Type', 'image/gif');
    res.end(encoder.out.getData(), 'binary');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function drawWrappedText(ctx, text, width, height, padding) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let fontSize = 150;
  let lines;
  const maxHeight = height - padding * 2;

  do {
    ctx.font = `${fontSize}px Arial`;
    const lineHeight = fontSize * 1.2;
    const maxWidth = width - padding * 2;

    const words = text.split(' ');
    let currentLine = '';
    lines = [];

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    if (lines.length * lineHeight > maxHeight) {
      fontSize -= 5;
    } else {
      break;
    }
  } while (fontSize > 10);

  ctx.font = `${fontSize}px Arial`;
  const lineHeight = fontSize * 1.2;

  for (let i = 0; i < lines.length; i++) {
    const drawY = padding + i * lineHeight;
    ctx.fillText(lines[i], padding, drawY);
  }
}

// Fungsi helper menggambar ulang teks pada context
async function drawLine(ctx, text) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  // ulangi logika word-wrap agar frame-1/2 tetap proporsional
  await generateCanvasImage(text, { width, height });
  // generateCanvasImage menggambar langsung pada context global (karena share canvas)
}
}