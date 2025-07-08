const express = require('express');
const axios = require('axios');
const Jimp = require('jimp');
const jsQR = require('jsqr');

module.exports = function(app) {

// Middleware express.json() tidak diperlukan untuk endpoint GET
// app.use(express.json());

// UBAH DARI app.post MENJADI app.get
app.get('/tools/qrscan', async (req, res) => {
    // UBAH DARI req.body MENJADI req.query
    const { imageUrl } = req.query;

    if (!imageUrl) {
        return res.status(400).json({ success: false, error: "Mohon sertakan parameter 'imageUrl' di URL." });
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
});
}