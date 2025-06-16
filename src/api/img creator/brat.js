// server.js - Diperbarui untuk posisi Kiri Atas

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
    
    // Ukuran gambar tetap 500x500
    const width = 500;
    const height = 500;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    // Menggambar background putih
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    // Pengaturan properti teks
    context.fillStyle = 'black';
    context.textAlign = 'left'; // Horizontal di kiri

    // --- PERUBAHAN 1: Mengubah baseline vertikal ke atas ---
    context.textBaseline = 'top'; 

    // Menyesuaikan ukuran font secara dinamis
    let fontSize = 100;
    const padding = 25; // Jarak dari tepi
    do {
        context.font = `${fontSize}px Arial`;
        fontSize -= 2;
    } while (context.measureText(text).width > width - (padding * 2));

    // --- PERUBAHAN 2: Mengatur posisi Y ke atas ---
    const x = padding; // Posisi X tetap di kiri
    const y = padding; // Posisi Y sekarang di atas (ditambah padding)

    // Menulis teks ke canvas
    context.fillText(text, x, y);

    // Membuat Buffer dari canvas dan mengirimnya
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
});
}