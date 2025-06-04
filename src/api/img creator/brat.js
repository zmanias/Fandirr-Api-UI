import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

module.exports = function(app) {

app.use(express.urlencoded({ extended: true }));

const fname = fileURLToPath(import.meta.url);
const dname = path.dirname(fname);

// Fungsi konversi ke WebP
const cwebp = async (input, output) => {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', input,
            '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
            '-vcodec', 'libwebp',
            '-lossless', '1',
            '-qscale', '75',
            '-preset', 'default',
            '-loop', '0',
            '-an',
            '-vsync', '0',
            output
        ]);

        ffmpeg.on('close', code => {
            if (code === 0) resolve(output);
            else reject(new Error(`ffmpeg keluar dengan kode: ${code}`));
        });
    });
};

// Endpoint API
app.get('/imgcreator/brat', async (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).json({ error: 'Parameter ?text= wajib diisi' });

    try {
        const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        const tmpInput = path.join(tmpdir(), `${Date.now()}.jpg`);
        const tmpOutput = path.join(tmpdir(), `${Date.now()}.webp`);

        fs.writeFileSync(tmpInput, response.data);
        await cwebp(tmpInput, tmpOutput);
        const stickerBuffer = fs.readFileSync(tmpOutput);

        res.setHeader('Content-Type', 'image/webp');
        res.send(stickerBuffer);

        fs.unlinkSync(tmpInput);
        fs.unlinkSync(tmpOutput);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal membuat sticker' });
    }
});
}