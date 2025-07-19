// hook.js
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

// === GANTI SECRET INI SESUAI YANG DISET DI GITHUB ===
const SECRET = 'fandirr123';

module.exports = function(app) {

function verifySignature(req, body) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end('Method Not Allowed');
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    if (!verifySignature(req, body)) {
      res.writeHead(403);
      return res.end('Invalid signature');
    }

    // Jalankan git pull
    exec('git pull origin main', (err, stdout, stderr) => {
      if (err) {
        console.error('Gagal git pull:', stderr);
        res.writeHead(500);
        return res.end('Gagal git pull');
      }

      console.log('Git pull berhasil:\n' + stdout);
      res.writeHead(200);
      res.end('Git pull berhasil');
    });
  });
});
}