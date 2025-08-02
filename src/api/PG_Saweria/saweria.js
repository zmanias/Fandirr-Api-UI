const express = require('express');
const axios = require('axios');
const qrcode = require('qrcode');
const cheerio = require('cheerio');
const moment = require('moment-timezone');

module.exports = function(app) {

// --- Logika Inti dari Class Saweria (Tidak ada perubahan) ---
class Saweria {
    constructor(user_id) {
        this.user_id = user_id;
        this.baseUrl = 'https://saweria.co';
        this.apiUrl = 'https://backend.saweria.co';
    }

    async login(email, password) {
        try {
            const { data } = await axios.post(`${this.apiUrl}/auth/login`, { email, password });
            if (!data.data || !data.data.id) throw new Error('Login failed, user ID not found');
            return { creator: 'Saweria', status: true, data: { user_id: data.data.id } };
        } catch (error) {
            const message = error.response ? error.response.data.message : error.message;
            throw new Error(message);
        }
    }

    async createPayment(amount, msg = 'Order') {
        if (!this.user_id) throw new Error('USER ID NOT FOUND');
        try {
            const payload = {
                agree: true,
                amount: Number(amount),
                customer_info: { first_name: 'fandirr', email: "fandirrstore@gmail.com", phone: '' },
                message: msg,
                notUnderAge: true,
                payment_type: 'qris',
                vote: ''
            };
            const { data } = await axios.post(`${this.apiUrl}/donations/${this.user_id}`, payload);

            if (!data.data || !data.data.id) throw new Error('Failed to create payment');
            
            const paymentData = data.data;
            const qr_image = await qrcode.toDataURL(paymentData.qr_string, { scale: 8 });

            return {
                creator: 'Saweria',
                status: true,
                data: {
                    ...paymentData,
                    expired_at: moment(paymentData.created_at).add(10, 'minutes').tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss'),
                    receipt: `${this.baseUrl}/qris/${paymentData.id}`,
                    url: `${this.baseUrl}/qris/${paymentData.id}`,
                    qr_image: qr_image
                }
            };
        } catch (error) {
            const message = error.response ? error.response.data.message : error.message;
            throw new Error(message);
        }
    }

    async checkPayment(id) {
        if (!this.user_id) throw new Error('USER ID NOT FOUND');
        try {
            const { data: html } = await axios.get(`${this.baseUrl}/receipt/${id}`);
            const $ = cheerio.load(html);
            const msg = $('h2.chakra-heading.css-14dtuui').text();

            if (!msg) throw new Error('Transaksi tidak ditemukan atau belum selesai.');

            return { creator: 'Saweria', status: (msg === 'OA4xSN'), msg: msg.toUpperCase() };
        } catch (error) {
            const message = error.response ? `Gagal mengakses receipt: ${error.response.status}` : error.message;
            throw new Error(message);
        }
    }
}

// === ENDPOINTS REST API (Versi GET Semua) ===

// 1. Endpoint untuk Login (diubah ke GET)
app.get('/saweria/login', async (req, res) => {
    // Data diambil dari query parameter, bukan body
    const { email, password } = req.query;
    if (!email || !password) {
        return res.status(400).json({ status: false, message: 'Parameter email dan password wajib diisi.' });
    }
    try {
        const saweria = new Saweria();
        const result = await saweria.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ status: false, message: error.message });
    }
});

// 2. Endpoint untuk Membuat Pembayaran (diubah ke GET)
app.get('/saweria/payment/create', async (req, res) => {
    // Data diambil dari query parameter, bukan body
    const { user_id, amount, message } = req.query;
    if (!user_id || !amount) {
        return res.status(400).json({ status: false, message: 'Parameter user_id dan amount wajib diisi.' });
    }
    try {
        const saweria = new Saweria(user_id);
        const result = await saweria.createPayment(amount, message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});

// 3. Endpoint untuk Cek Status Pembayaran (tetap GET)
app.get('/saweria/payment/status/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!user_id) {
        return res.status(400).json({ status: false, message: 'Parameter "user_id" wajib diisi.' });
    }
    try {
        const saweria = new Saweria(user_id);
        const result = await saweria.checkPayment(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});
}