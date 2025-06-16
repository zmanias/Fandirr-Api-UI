// server.js - Diperbarui dengan Word Wrap

const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const path = require('path');

module.exports = function(app) {

// Daftarkan font
try {
    registerFont(path.join(__dirname, 'arial.ttf'), { family: 'Arial' });
} catch (error) {
    console.error("PENTING: Gagal memuat font 'arial.ttf'.");
}

app.get('/imgcreator/brat', (req, res) => {
    const text = req.query.text || 'hallo';
    
    // Pengaturan gambar
    const width = 500;
    const height = 500;
    const padding = 25;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    // Latar belakang putih
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    // Pengaturan Teks
    context.fillStyle = 'black';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    const fontSize = 80; // Kita atur ukuran font yang lebih tetap untuk multi-baris
    context.font = `${fontSize}px Arial`;

    // =================================================================
    // --- LOGIKA BARU: WORD WRAP UNTUK TEKS PANJANG ---
    // =================================================================
    
    // 1. Tentukan lebar maksimal untuk teks dan tinggi per baris
    const maxWidth = width - (padding * 2);
    const lineHeight = fontSize * 1.2; // Jarak antar baris (1.2x ukuran font)

    // 2. Pisahkan teks menjadi kata-kata
    const words = text.split(' ');
    let currentLine = '';
    const lines = [];

    // 3. Loop setiap kata untuk membentuk baris
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + word + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        // Jika lebar tes melebihi batas DAN baris saat ini tidak kosong
        if (testWidth > maxWidth && currentLine.length > 0) {
            lines.push(currentLine.trim()); // Simpan baris yang sudah pas
            currentLine = word + ' ';   // Mulai baris baru dengan kata saat ini
        } else {
            currentLine = testLine; // Jika masih muat, tambahkan kata ke baris saat ini
        }
    }
    lines.push(currentLine.trim()); // Simpan sisa baris terakhir

    // =================================================================
    // --- LOGIKA MENGGAMBAR BARIS DEMI BARIS ---
    // =================================================================
    const x = padding;
    const y = padding;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const drawY = y + (i * lineHeight); // Hitung posisi Y untuk setiap baris
        context.fillText(line, x, drawY);
    }

    // Kirim hasil gambar
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
});
}