const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Impor dan konfigurasi dayjs untuk format waktu
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

// Path menuju file settings.json (sesuaikan jika perlu)
const settingsFilePath = path.join(__dirname, '../../../src/settings.json');

// --- Helper Function ---
// Fungsi bantuan untuk memformat tanggal ke format kustom "Tanggal : ... Waktu : ..."
const formatToCustomString = (date) => {
  if (!date) return null; // Jika tidak ada tanggal, kembalikan null
  const dateStr = dayjs(date).tz('Asia/Jakarta').format('DD-MM-YYYY');
  const timeStr = dayjs(date).tz('Asia/Jakarta').format('HH:mm:ss');
  return `Tanggal : ${dateStr}\\nWaktu : ${timeStr}`;
};

// --- Middleware ---
// Middleware khusus untuk memeriksa Master API Key
const validateMasterKey = (req, res, next) => {
    const masterKey = req.query.masterkey;
    try {
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
        if (!masterKey || masterKey !== settings.apiSettings.masterApiKey) {
            return res.status(403).json({ status: 403, message: 'Forbidden. A valid master API key is required.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Could not read settings file.' });
    }
};


// --- Endpoints ---
module.exports = function(app, validateApiKey) {

    // Endpoint untuk membuat API key baru yang acak
    app.get('/apikey/create', validateMasterKey, (req, res) => {
        try {
            const { days } = req.query;
            const validityDays = parseInt(days) || 30; // Default 30 hari jika tidak ditentukan

            const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
            const newApiKey = crypto.randomBytes(20).toString('hex');
            const expirationDate = dayjs().add(validityDays, 'day').toDate();

            const newKeyObject = {
                key: newApiKey,
                expires: formatToCustomString(expirationDate),
                createdAt: formatToCustomString(new Date())
            };

            settings.apiSettings.apikeys.push(newKeyObject);
            fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

            res.status(201).json({
                status: 201,
                message: `API key created successfully. It will be valid for ${validityDays} days.`,
                data: newKeyObject
            });

        } catch (error) {
            res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
        }
    });

    // Endpoint untuk membuat API key KUSTOM
    app.get('/apikey/create-custom', validateMasterKey, (req, res) => {
        try {
            const { customkey, days } = req.query;

            if (!customkey) {
                return res.status(400).json({ status: 400, message: 'Parameter "customkey" is required.' });
            }

            const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
            const apiKeysList = settings.apiSettings.apikeys;

            const keyExists = apiKeysList.some(k => k.key === customkey);
            if (keyExists) {
                return res.status(409).json({ status: 409, message: 'Maaf om Apikey tersebut sudah terpakai.' });
            }

            let expirationDateObject = null;
            if (days && !isNaN(parseInt(days))) {
                const validityDays = parseInt(days);
                expirationDateObject = dayjs().add(validityDays, 'day').toDate();
            }

            const newKeyObject = {
                key: customkey,
                expires: formatToCustomString(expirationDateObject),
                createdAt: formatToCustomString(new Date())
            };

            settings.apiSettings.apikeys.push(newKeyObject);
            fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

            res.status(201).json({
                status: 201,
                message: `Custom API key '${customkey}' created successfully.`,
                data: newKeyObject
            });

        } catch (error) {
            res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
        }
    });

    // Endpoint untuk melihat daftar semua API key
    app.get('/apikey/list', validateMasterKey, (req, res) => {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
            const apiKeysList = settings.apiSettings.apikeys;

            res.status(200).json({
                status: 200,
                count: apiKeysList.length,
                data: apiKeysList
            });

        } catch (error) {
            res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
        }
    });
};