// Impor modul yang dibutuhkan
const express = require('express');
const fs = require('fs'); // Modul File System untuk membaca file
const path = require('path'); // Modul Path untuk menangani path file

module.exports = function(app) {

// --- Memuat Data dari File JSON ---
let cakLontongData = [];
try {
  // Tentukan path ke file caklontong.json di dalam folder 'data'
  const filePath = path.join(__dirname, 'data', 'caklontong.json');
  
  // Baca file secara sinkron saat server pertama kali dijalankan
  const rawData = fs.readFileSync(filePath);
  
  // Ubah data mentah (buffer) menjadi objek JavaScript
  cakLontongData = JSON.parse(rawData);
  console.log(`[INFO] Berhasil memuat ${cakLontongData.length} soal Cak Lontong.`);

} catch (error) {
  console.error("[ERROR] Gagal memuat file 'data/caklontong.json'. Pastikan struktur folder dan file sudah benar.", error);
  // Hentikan server jika data tidak bisa dimuat, karena API tidak akan berfungsi
  process.exit(1);
}

/**
 * Endpoint untuk mendapatkan satu soal Cak Lontong secara acak.
 * Metode: GET
 */
app.get('/caklontong', (req, res) => {
  // Pastikan ada data untuk diproses
  if (cakLontongData.length === 0) {
    return res.status(500).json({
      success: false,
      error: "Data soal tidak tersedia di server."
    });
  }

  // Ambil satu indeks acak dari array data
  const randomIndex = Math.floor(Math.random() * cakLontongData.length);
  const randomQuestion = cakLontongData[randomIndex];

  // Kirim respons sukses dengan data JSON yang dipilih secara acak
  res.status(200).json({
    success: true,
    data: {
      soal: randomQuestion.soal,
      jawaban: randomQuestion.jawaban,
      deskripsi: randomQuestion.deskripsi
    }
  });
});
}