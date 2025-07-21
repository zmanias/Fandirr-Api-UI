const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/', express.static(path.join(__dirname, 'api-page')));
app.use('/src', express.static(path.join(__dirname, 'src')));

const settingsPath = path.join(__dirname, './src/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status,
                creator: settings.apiSettings.creator || "Created Using Rynn UI",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

// ======================================================
// BAGIAN UNTUK REAL-TIME NOTIFICATION (SERVER-SENT EVENTS)
// ======================================================

// Endpoint khusus yang akan terus membuka koneksi
app.get('/events', (req, res) => {
    // Atur header khusus untuk SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders(); // Kirim header segera

    // Kirim komentar untuk menjaga koneksi tetap terbuka
    res.write('data: Connection established\n\n');

    // SIMULASI: Kirim notifikasi setiap 15 detik
    const intervalId = setInterval(() => {
        const message = `Update baru pada ${new Date().toLocaleTimeString()}`;
        // Kirim data dengan format 'data: ...\n\n'
        res.write(`data: ${message}\n\n`);
    }, 15000);

    // Jika koneksi ditutup oleh klien, hentikan pengiriman notifikasi
    req.on('close', () => {
        clearInterval(intervalId);
    });
});

// Middleware untuk memvalidasi API key pada setiap permintaan
const validateApiKey = (req, res, next) => {
  console.log('--- FUNGSI VALIDATE API KEY DIPANGGIL! ---');
    const userApiKey = req.query.apikey;

    if (!userApiKey) {
        return res.status(401).json({
            status: 401,
            message: 'Unauthorized. Please provide an API key.'
        });
    }

    // Baca ulang settings setiap kali ada request untuk data terbaru
    const currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const validApiKeys = currentSettings.apiSettings.apikeys;

    // Cari kunci yang cocok di dalam array objek
    const keyData = validApiKeys.find(k => k.key === userApiKey);

    if (keyData) {
        // Jika kunci ditemukan, periksa tanggal kedaluwarsa
        if (keyData.expires && new Date(keyData.expires) < new Date()) {
            // Jika kunci sudah kedaluwarsa
            return res.status(403).json({
                status: 403,
                message: 'Maaf kawan, Apikey nya udah mokad/Expired. Hubungi Wa 083155619441 Untuk membeli apikey lagi'
            });
        }
        // Jika kunci valid dan tidak kedaluwarsa
        next();
    } else {
        // Jika kunci tidak ditemukan
        return res.status(403).json({
            status: 403,
            message: 'Maaf Apikey Tersebut Tidak ada, jangan di paksa om kalo gaada mah:v'
        });
    }
};

// Api Route
let totalRoutes = 0;
const apiFolder = path.join(__dirname, './src/api');
fs.readdirSync(apiFolder).forEach((subfolder) => {
    const subfolderPath = path.join(apiFolder, subfolder);
    if (fs.statSync(subfolderPath).isDirectory()) {
        fs.readdirSync(subfolderPath).forEach((file) => {
            const filePath = path.join(subfolderPath, file);
            if (path.extname(file) === '.js') {
              ///Baru Apikeys
                require(filePath)(app, validateApiKey);
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${path.basename(file)} `));
            }
        });
    }
});
// ... setelah loop 'fs.readdirSync(apiFolder).forEach(...)'
app.post('/', (req, res) => {
    console.log('Webhook diterima:', req.body);
    res.json({ status: 200, message: 'Webhook received' });
});
// ENDPOINT UNTUK REDIRECT SHORT URL
app.get('/:shortcode', (req, res, next) => {
    const { shortcode } = req.params;
    const dbPathRedirect = path.join(__dirname, './src/database/urls.json');

    try {
        const data = fs.readFileSync(dbPathRedirect, 'utf8');
        const db = JSON.parse(data);
        const urlEntry = db.find(entry => entry.short === shortcode);

        if (urlEntry) {
            // Jika ditemukan, lakukan redirect
            res.redirect(301, urlEntry.long);
        } else {
            // Jika tidak ditemukan, lanjutkan ke handler selanjutnya (yaitu 404)
            next();
        }
    } catch (error) {
        // Jika ada error (misal file tidak ada), lanjutkan saja
        next();
    }
});

// app.use((req, res, next) => { res.status(404).sendFile... })
// ... sisa kode Anda
console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-page', 'index.html'));
});

app.use((req, res, next) => {
    res.status(404).sendFile(process.cwd() + "/api-page/404.html");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(process.cwd() + "/api-page/500.html");
});

app.listen(PORT, () => {
    console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `));
});

module.exports = app;