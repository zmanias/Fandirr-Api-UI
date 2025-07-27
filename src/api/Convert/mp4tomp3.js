const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// =======================================================
// FUNGSI INTI ANDA (Tidak ada perubahan signifikan)
// =======================================================
async function tomp3(url) {
    const h = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36'
    };
    const fname = url.split('/').pop();
    const datajob = {
        tasks: {
            "import": {
                operation: "import/url",
                url: url,
                filename: fname
            },
            convert: {
                operation: "convert",
                input: "import",
                output_format: "mp3"
            },
            "export-url": {
                operation: "export/url",
                input: "convert"
            }
        }
    };
    try {
        const procres = await axios.post('https://api.freeconvert.com/v1/process/jobs', datajob, { headers: h });
        const idjob = procres.data.id;

        // Fungsi rekursif untuk mengecek status job
        async function checkjobs() {
            const statsres = await axios.get(`https://api.freeconvert.com/v1/process/jobs/${idjob}`, { headers: h });
            const jobStatus = statsres.data.status;

            console.log(`Job ID: ${idjob}, Status: ${jobStatus}`); // Log status untuk debugging

            if (jobStatus === 'completed') {
                const taskex = statsres.data.tasks.find(task => task.name === 'export-url');
                if (taskex?.result?.url) {
                    return taskex.result.url;
                }
                throw new Error('URL MP3 tidak ditemukan setelah job selesai.');
            }
            if (jobStatus === 'failed') {
                throw new Error('Proses konversi gagal di server FreeConvert.');
            }

            // Tunggu 2 detik sebelum cek lagi
            await new Promise(resolve => setTimeout(resolve, 2000));
            return checkjobs();
        }
        return await checkjobs();
    } catch (e) {
        const errorMessage = e.response?.data?.message || e.message;
        throw new Error(errorMessage);
    }
}


// =======================================================
// ENDPOINT REST API
// =======================================================
app.get('/convert/mp4tomp3', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            status: 'error',
            message: 'Query parameter "url" wajib diisi.'
        });
    }

    try {
        console.log(`Memulai proses konversi untuk URL: ${url}`);
        const mp3Url = await tomp3(url);
        res.json({
            status: 'success',
            data: {
                mp3_url: mp3Url
            }
        });
    } catch (error) {
        console.error('Error saat konversi:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`✅ Server API MP3 Converter berjalan di http://localhost:${PORT}`);
});