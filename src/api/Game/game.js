// Impor modul yang dibutuhkan
const express = require('express');
const fs = require('fs'); // Modul File System untuk membaca file
const path = require('path'); // Modul Path untuk menangani path file

module.exports = function(app) {

// --- Memuat Semua Data Game dari Folder 'data' ---

let cakLontongData = [];
let tebakGambarData = [];

// Fungsi untuk memuat data JSON dengan aman
function loadGameData(fileName, dataContainer) {
  try {
    const filePath = path.join(__dirname, 'data', fileName);
    const rawData = fs.readFileSync(filePath);
    const jsonData = JSON.parse(rawData);
    dataContainer.push(...jsonData); // Mengisi array dengan data dari file
    console.log(`[INFO] Berhasil memuat ${jsonData.length} soal dari ${fileName}.`);
  } catch (error) {
    console.error(`[ERROR] Gagal memuat file '${fileName}'. Pastikan file ada di folder 'data'.`, error);
    // Hentikan server jika data penting tidak bisa dimuat
    process.exit(1);
  }
}

// Muat semua data game saat server dimulai
loadGameData('caklontong.json', cakLontongData);
loadGameData('tebakgambar.json', tebakGambarData);


// --- Endpoint Game ---

/**
 * Endpoint untuk mendapatkan satu soal Cak Lontong secara acak.
 * Metode: GET
 */
app.get('/game/caklontong', (req, res) => {
  if (cakLontongData.length === 0) {
    return res.status(500).json({ success: false, error: "Data soal Cak Lontong tidak tersedia." });
  }

  const randomIndex = Math.floor(Math.random() * cakLontongData.length);
  const randomQuestion = cakLontongData[randomIndex];

  res.status(200).json({
    success: true,
    data: {
      soal: randomQuestion.soal,
      jawaban: randomQuestion.jawaban,
      deskripsi: randomQuestion.deskripsi
    }
  });
});

/**
 * Endpoint BARU untuk mendapatkan satu soal Tebak Gambar secara acak.
 * Metode: GET
 */
app.get('/game/tebakgambar', (req, res) => {
  if (tebakGambarData.length === 0) {
    return res.status(500).json({ success: false, error: "Data soal Tebak Gambar tidak tersedia." });
  }

  const randomIndex = Math.floor(Math.random() * tebakGambarData.length);
  const randomImage = tebakGambarData[randomIndex];

  res.status(200).json({
    success: true,
    data: {
      img: randomImage.img,
      jawaban: randomImage.jawaban,
      deskripsi: randomImage.deskripsi
    }
  });
});
}