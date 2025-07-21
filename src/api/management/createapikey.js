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