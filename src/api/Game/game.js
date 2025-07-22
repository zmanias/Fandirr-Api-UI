// Impor modul yang dibutuhkan
const express = require('express');
const fs = require('fs'); // Modul File System untuk membaca file
const path = require('path'); // Modul Path untuk menangani path file

module.exports = function(app) {

// --- Memuat Semua Data Game dari Folder 'data' ---

let cakLontongData = [];
let tebakGambarData = [];
let siapakahAkuData = [];
let susunKataData = []; // Array baru untuk data "Susun Kata"

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
loadGameData('siapakahaku.json', siapakahAkuData);
loadGameData('susunkata.json', susunKataData); // Memuat data game baru


// --- Endpoint Game ---

/**
 * Endpoint untuk game Cak Lontong.
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
 * Endpoint untuk game Tebak Gambar.
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

/**
 * Endpoint untuk game Siapakah Aku.
 */
app.get('/game/siapakahaku', (req, res) => {
  if (siapakahAkuData.length === 0) {
    return res.status(500).json({ success: false, error: "Data soal Siapakah Aku tidak tersedia." });
  }
  const randomIndex = Math.floor(Math.random() * siapakahAkuData.length);
  const randomQuestion = siapakahAkuData[randomIndex];
  res.status(200).json({
    success: true,
    data: {
      soal: randomQuestion.soal,
      jawaban: randomQuestion.jawaban
    }
  });
});

/**
 * Endpoint BARU untuk game Susun Kata.
 */
app.get('/game/susunkata', (req, res) => {
    if (susunKataData.length === 0) {
      return res.status(500).json({ success: false, error: "Data soal Susun Kata tidak tersedia." });
    }
    const randomIndex = Math.floor(Math.random() * susunKataData.length);
    const randomQuestion = susunKataData[randomIndex];
    res.status(200).json({
      success: true,
      data: {
        soal: randomQuestion.soal,
        tipe: randomQuestion.tipe,
        jawaban: randomQuestion.jawaban
      }
    });
  });
}
}