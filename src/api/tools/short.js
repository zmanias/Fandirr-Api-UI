const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

module.exports = function(app) {

// Path menuju file database JSON kita
const dbPath = path.join(__dirname, '../../../src/database/urls.json');

// Fungsi untuk membaca data dari file JSON
const readDb = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Jika file tidak ada atau error, kembalikan array kosong
        return [];
    }
};

// Fungsi untuk menulis data ke file JSON
const writeDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

    // 1. ENDPOINT: Membuat Short URL Baru
    app.get('/shorturl/create', async (req, res) => {
        const { url } = req.query;

        // Validasi URL
        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ status: 400, message: 'URL parameter is required and must be a valid URL (starts with http/https).' });
        }

        try {
            const db = readDb();
            
            // Buat ID pendek yang unik (6 karakter)
            const shortCode = nanoid(6);

            const newUrlEntry = {
                short: shortCode,
                long: url,
                createdAt: new Date().toISOString()
            };

            db.push(newUrlEntry);
            writeDb(db);

            res.json({
                status: 200,
                message: 'Short URL created successfully.',
                short_url: `${req.protocol}://${req.get('host')}/${shortCode}`,
                ...newUrlEntry
            });

        } catch (error) {
            res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
        }
    });

    // 2. ENDPOINT: Menampilkan Semua Short URL
    app.get('/shorturl/list', async (req, res) => {
        const db = readDb();
        res.json({
            status: 200,
            count: db.length,
            urls: db
        });
    });

    // 3. ENDPOINT: Menghapus Short URL
    app.get('/shorturl/delete', async (req, res) => {
        const { short } = req.query;

        if (!short) {
            return res.status(400).json({ status: 400, message: 'Parameter "short" code is required.' });
        }

        let db = readDb();
        const initialLength = db.length;
        
        // Filter database untuk menghapus entri dengan short code yang cocok
        db = db.filter(entry => entry.short !== short);

        if (db.length === initialLength) {
            return res.status(404).json({ status: 404, message: 'Short code not found.' });
        }

        writeDb(db);
        res.json({ status: 200, message: `Short URL with code '${short}' has been deleted.` });
    });
}