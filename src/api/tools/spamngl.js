const express = require('express');
const fetch = require('node-fetch');

module.exports = function(app) {

// --- Fungsi Inti dari Kode Anda (Tidak ada perubahan) ---
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function spamngl(link, pesan, jumlah) {
  if (!link || !link.startsWith('https://ngl.link/')) {
    throw new Error('URL link NGL tidak valid. Contoh: https://ngl.link/username');
  }
  if (!pesan) {
    throw new Error('Pesan tidak boleh kosong.');
  }
  const jumlahInt = parseInt(jumlah);
  if (isNaN(jumlahInt) || jumlahInt < 1) {
    throw new Error('Jumlah harus berupa angka dan minimal 1.');
  }

  const username = link.split('https://ngl.link/')[1];
  if (!username) {
    throw new Error('Username tidak dapat ditemukan dari link.');
  }

  console.log(`Memulai spam ke ${username} sebanyak ${jumlahInt} kali...`);

  let successCount = 0;
  for (let i = 0; i < jumlahInt; i++) {
    try {
      const response = await fetch('https://ngl.link/api/submit', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        },
        body: `username=${username}&question=${encodeURIComponent(pesan)}&deviceId=1`
      });

      if (response.ok) {
        successCount++;
        console.log(`Pesan ke-${i + 1} berhasil dikirim.`);
      } else {
        console.log(`Pesan ke-${i + 1} gagal dikirim dengan status: ${response.status}`);
      }

      await delay(500);
    } catch (err) {
      console.error(`Gagal pada pengiriman ke-${i + 1}: `, err.message);
    }
  }

  return `Selesai! ${successCount} dari ${jumlahInt} pesan berhasil dikirim ke ${username}.`;
}

// --- Endpoint API (Diubah ke GET) ---
app.get('/spam-ngl', async (req, res) => {
  // Ambil parameter dari query URL, bukan dari body
  const { link, pesan, jumlah } = req.query;

  if (!link || !pesan || !jumlah) {
    return res.status(400).json({
      status: 'error',
      message: 'Query parameter "link", "pesan", dan "jumlah" wajib ada.'
    });
  }

  try {
    const hasil = await spamngl(link, pesan, jumlah);
    res.json({
      status: 'success',
      message: hasil
    });
  } catch (e) {
    res.status(400).json({
      status: 'error',
      message: e.message
    });
  }
});
}