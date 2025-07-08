const express = require('express');
const axios = require('axios');
const Jimp = require('jimp');
const jsQR = require('jsqr');

module.exports = function(app) {

/**
 * Handler utama untuk memproses gambar QR.
 * Fungsi ini akan dipanggil oleh route GET dan POST.
 */
const decodeQrHandler = async (req, res) => {
    // Cek apakah ini request POST atau GET untuk mengambil imageUrl
    // Jika POST, ambil dari body. Jika GET, ambil dari query.
    const imageUrl = req.method === 'POST' ? req.body.imageUrl : req.query.imageUrl;

    if (!imageUrl) {
        const errorMessage = req.method === 'POST' 
            ? "Mohon sertakan 'imageUrl' di body request."
            : "Mohon sertakan parameter 'imageUrl' di URL.";
        return res.status(400).json({ success: false, error: errorMessage });
    }

    try {
        // 1. Unduh gambar dari URL
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // 2. Proses gambar untuk mendapatkan data piksel
        const image = await Jimp.read(imageBuffer);
        const imageData = {
            data: image.bitmap.data,
            width: image.bitmap.width,
            height: image.bitmap.height,
        };

        // 3. Baca QR code dari data piksel
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode) {
            // 4. Kirim data jika QR code ditemukan
            res.status(200).json({
                success: true,
                data: qrCode.data
            });
        } else {
            res.status(404).json({
                success: false,
                error: "QR code tidak ditemukan pada gambar."
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: "Gagal memproses gambar.",
            message: error.message
        });
    }
};

// --- Mendefinisikan Routes ---
// Kedua route ini akan menggunakan handler yang sama
app.get('/tools/qrscan', decodeQrHandler);
app.post('/tools/qrscan', decodeQrHandler);
}