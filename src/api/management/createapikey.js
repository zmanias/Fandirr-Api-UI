const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const settingsFilePath = path.join(__dirname, '../../../src/settings.json');

// Middleware khusus untuk memeriksa Master API Key
const validateMasterKey = (req, res, next) => {
    const masterKey = req.query.masterkey;
    const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    
    if (!masterKey || masterKey !== settings.apiSettings.masterApiKey) {
        return res.status(403).json({ status: 403, message: 'Forbidden. A valid master API key is required.' });
    }
    next();
};


module.exports = function(app) {
// Endpoint untuk membuat API key KUSTOM
app.get('/apikey/create-custom', validateMasterKey, (req, res) => {
    try {
        const { customkey, days } = req.query;

        // 1. Validasi input
        if (!customkey) {
            return res.status(400).json({ status: 400, message: 'Parameter "customkey" is required.' });
        }

        // Baca file settings.json
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
        const apiKeysList = settings.apiSettings.apikeys;

        // 2. Cek apakah custom key sudah digunakan
        const keyExists = apiKeysList.some(k => k.key === customkey);
        if (keyExists) {
            return res.status(409).json({ status: 409, message: 'Conflict. This API key already exists.' });
        }

        // 3. Tentukan tanggal kedaluwarsa
        let expirationDate = null; // Default: tidak pernah kedaluwarsa
        if (days && !isNaN(parseInt(days))) {
            const validityDays = parseInt(days);
            const now = new Date();
            expirationDate = new Date(now.setDate(now.getDate() + validityDays)).toISOString();
        }

        // 4. Buat objek kunci baru
        const newKeyObject = {
            key: customkey,
            expires: expirationDate,
            createdAt: new Date().toISOString()
        };

        // 5. Tambahkan kunci baru dan simpan ke file
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
        // Baca file settings.json
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

    // Endpoint untuk membuat API key baru
    app.get('/apikey/create', validateMasterKey, (req, res) => {
        try {
            const { days } = req.query;
            const validityDays = parseInt(days) || 30; // Default 30 hari jika tidak ditentukan

            // Baca file settings.json
            const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));

            // Buat API key baru yang acak
            const newApiKey = crypto.randomBytes(20).toString('hex');

            // Hitung tanggal kedaluwarsa
            const now = new Date();
            const expirationDate = new Date(now.setDate(now.getDate() + validityDays));

            // Buat objek kunci baru
            const newKeyObject = {
                key: newApiKey,
                expires: expirationDate.toISOString(),
                createdAt: new Date().toISOString()
            };

            // Tambahkan kunci baru ke dalam array
            settings.apiSettings.apikeys.push(newKeyObject);

            // Tulis kembali perubahan ke file settings.json
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
};