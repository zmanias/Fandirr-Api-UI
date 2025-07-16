// Gunakan 'dotenv' untuk menyimpan kunci rahasia dengan aman
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // Untuk membuat ID unik

module.exports = function(app) {

// Ambil username dan stream key dari environment variables
const SAWERIA_USERNAME = process.env.SAWERIA_USERNAME;
const SAWERIA_STREAM_KEY = process.env.SAWERIA_STREAM_KEY;

// Validasi bahwa variabel lingkungan sudah diatur
if (!SAWERIA_USERNAME || !SAWERIA_STREAM_KEY) {
  console.error("Error: Pastikan SAWERIA_USERNAME dan SAWERIA_STREAM_KEY sudah diatur di file .env");
  process.exit(1); // Hentikan server jika konfigurasi tidak ada
}

/**
 * Endpoint untuk membuat link pembayaran Saweria.
 * Metode: GET
 * Query Params: ?amount=10000&message=Donasi+untuk+kopi
 */
app.get('/saweria/create', (req, res) => {
  // Ambil data dari query parameter (req.query)
  const { amount, message } = req.query;
  
  // Konversi amount dari string ke angka
  const numericAmount = parseInt(amount, 10);

  if (!numericAmount || isNaN(numericAmount) || numericAmount < 1000) {
    return res.status(400).json({
      success: false,
      error: 'Parameter query "amount" harus berupa angka dan minimal 1000.'
    });
  }

  // Buat pesan dengan ID unik untuk memudahkan pelacakan
  const uniqueId = uuidv4().split('-')[0]; // Ambil bagian pertama dari UUID
  const finalMessage = message ? `${message} (ID: ${uniqueId})` : `ID: ${uniqueId}`;

  // Encode URL agar aman
  const encodedMessage = encodeURIComponent(finalMessage);
  const paymentUrl = `https://saweria.co/payment?amount=${numericAmount}&msg=${encodedMessage}&username=${SAWERIA_USERNAME}`;
  
  console.log(`Generated payment link for amount ${numericAmount} with ID ${uniqueId}`);

  res.status(200).json({
    success: true,
    data: {
      payment_id: uniqueId,
      amount: numericAmount,
      message: finalMessage,
      payment_url: paymentUrl,
      note: "Arahkan pengguna ke payment_url untuk melakukan pembayaran."
    }
  });
});

/**
 * Endpoint untuk mengecek status donasi terakhir.
 * Metode: GET
 */
app.get('/saweria/cekstatus', async (req, res) => {
  try {
    const saweriaApiUrl = `https://api.saweria.co/v1/stream/widget/event?streamKey=${SAWERIA_STREAM_KEY}`;
    
    const response = await axios.get(saweriaApiUrl);

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Filter hanya untuk event donasi
      const donations = response.data.data
        .filter(event => event.type === 'donation')
        .map(event => ({
          donator: event.payload.donator,
          amount: event.payload.amount,
          message: event.payload.message,
          created_at: event.created_at
        }));
      
      res.status(200).json({
        success: true,
        data: donations
      });
    } else {
      res.status(200).json({
        success: true,
        data: [],
        message: "Belum ada donasi yang masuk."
      });
    }

  } catch (error) {
    console.error("Error saat menghubungi API Saweria:", error.message);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil data dari Saweria."
    });
  }
});
}