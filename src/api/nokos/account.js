// /src/api/virtusim/account.js

const fetch = require('node-fetch');
const baseUrl = 'https://virtusim.com/api/v2/json.php';

// Helper function untuk menangani permintaan ke VirtuSIM
async function fetchVirtuSIM(action, req, res) {
    // Ambil key_otp dari parameter query
    const { key_otp } = req.query;

    // Validasi: pastikan key_otp disediakan
    if (!key_otp) {
        return res.status(400).json({ 
            status: false, 
            data: { msg: 'Parameter "key_otp" is required.' } 
        });
    }

    try {
        // Panggil API VirtuSIM menggunakan key_otp dari pengguna
        const response = await fetch(`${baseUrl}?api_key=${key_otp}&action=${action}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ 
            status: false, 
            data: { msg: 'Internal Server Error', details: error.message } 
        });
    }
}

// File ini harus tetap menerima validateApiKey agar tidak error di index.js,
// tapi kita tidak akan menggunakannya di rute-rute di bawah ini.
module.exports = function(app, validateApiKey) {

    // Endpoint: Account Balance Check (tanpa validateApiKey)
    app.get('/virtusim/balance', async (req, res) => {
        await fetchVirtuSIM('balance', req, res);
    });

    // Endpoint: Balance Mutation (tanpa validateApiKey)
    app.get('/virtusim/balance-logs', async (req, res) => {
        await fetchVirtuSIM('balance_logs', req, res);
    });

    // Endpoint: Recent Activity (tanpa validateApiKey)
    app.get('/virtusim/recent-activity', async (req, res) => {
        await fetchVirtuSIM('recent_activity', req, res);
    });

};