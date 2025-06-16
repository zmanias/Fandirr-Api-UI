// server.js - Disempurnakan dengan Font Dinamis untuk Teks Sangat Panjang

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

    // Pengaturan Teks dasar
    context.fillStyle = 'black';
    context.textAlign = 'left';
    context.textBaseline = 'top';

    // =================================================================
    // --- LOGIKA BARU: FONT DINAMIS & WORD WRAP ---
    // =================================================================

    let fontSize = 150; // Mulai dengan ukuran font terbesar
    let lines;

    // Loop untuk menemukan ukuran font yang pas
    do {
        // Atur ulang font dengan ukuran yang mungkin lebih kecil
        context.font = `${fontSize}px Arial`;

        // 1. Jalankan logika Word Wrap dengan font size saat ini
        const lineHeight = fontSize * 1.2;
        const maxWidth = width - (padding * 2);
        const words = text.split(' ');
        let currentLine = '';
        lines = []; // Kosongkan array baris untuk percobaan baru

        for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = context.measureText(testLine);

            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine.trim());

        // 2. Cek apakah total tinggi teks melebihi tinggi gambar
        const totalTextBlockHeight = lines.length * lineHeight;
        if (totalTextBlockHeight > height - (padding * 2)) {
            fontSize -= 5; // Jika terlalu tinggi, kecilkan font dan ulangi loop
        } else {
            break; // Jika sudah pas, keluar dari loop
        }

    } while (fontSize > 10); // Batas ukuran font terkecil agar tidak terjadi infinite loop


    // =================================================================
    // --- MENGGAMBAR HASIL AKHIR ---
    // =================================================================
    const finalLineHeight = fontSize * 1.2;
    const x = padding;
    const y = padding;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const drawY = y + (i * finalLineHeight);
        context.fillText(line, x, drawY);
    }

    // Kirim hasil gambar
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
});
}