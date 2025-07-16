const express = require('express');
const axios =require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports = function(app) {

/**
 * Endpoint untuk membuat link pembayaran Saweria.
 * Metode: GET
 * Query Params: ?amount=...&message=...&username=...
 */
app.get('/saweria/create', (req, res) => {
  // Ambil semua data dari query parameter, termasuk username
  const { amount, message, username } = req.query;
  
  // Validasi untuk parameter baru
  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'Parameter query "username" wajib diisi.'
    });
  }
  
  const numericAmount = parseInt(amount, 10);
  if (!numericAmount || isNaN(numericAmount) || numericAmount < 1000) {
    return res.status(400).json({
      success: false,
      error: 'Parameter query "amount" harus berupa angka dan minimal 1000.'
    });
  }

  const uniqueId = uuidv4().split('-')[0];
  const finalMessage = message ? `${message} (ID: ${uniqueId})` : `ID: ${uniqueId}`;
  const encodedMessage = encodeURIComponent(finalMessage);
  
  // Gunakan username dari parameter untuk membuat URL
  const paymentUrl = `https://saweria.co/payment?amount=${numericAmount}&msg=${encodedMessage}&username=${username}`;
  
  console.log(`Generated payment link for user ${username} with ID ${uniqueId}`);

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
 * Query Params: ?streamKey=...
 */
app.get('/saweria/cekstatus', async (req, res) => {
  // Ambil streamKey dari query parameter
  const { streamKey } = req.query;

  // Validasi untuk parameter baru
  if (!streamKey) {
    return res.status(400).json({
      success: false,
      error: 'Parameter query "streamKey" wajib diisi.'
    });
  }

  try {
    // Gunakan streamKey dari parameter untuk memanggil API Saweria
    const saweriaApiUrl = `https://api.saweria.co/v1/stream/widget/event?streamKey=${streamKey}`;
    
    const response = await axios.get(saweriaApiUrl);

    if (response.data && response.data.data && response.data.data.length > 0) {
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