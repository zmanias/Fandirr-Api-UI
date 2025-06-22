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

// Middleware untuk memvalidasi API key pada setiap permintaan
const validateApiKey = (req, res, next) => {
  // 1. Ambil API key yang dikirim oleh pengguna melalui query parameter
  const userApiKey = req.query.apikey;

  // 2. Ambil daftar API key yang valid dari settings.json
  const validApiKeys = settings.apiSettings.apikey; //

  // 3. Cek apakah pengguna menyertakan API key
  if (!userApiKey) {
    // Jika tidak ada, kirim pesan error
    return res.status(401).json({
      status: 401,
      message: 'Unauthorized. Please provide an API key.',
      example: `${req.protocol}://${req.get('host')}${req.originalUrl}?apikey=YOUR_API_KEY`
    });
  }

  // 4. Cek apakah API key yang diberikan ada di dalam daftar yang valid
  if (validApiKeys.includes(userApiKey)) {
    // Jika valid, lanjutkan ke proses selanjutnya (menjalankan rute API)
    next();
  } else {
    // Jika tidak valid, kirim pesan error
    return res.status(403).json({
      status: 403,
      message: 'Forbidden. The API key you provided is not valid.'
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
                require(filePath)(app);
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${path.basename(file)} `));
            }
        });
    }
});
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