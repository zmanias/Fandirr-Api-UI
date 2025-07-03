const express = require('express');
const fs = require('fs').promises; // Menggunakan fs.promises untuk async/await
const path = require('path');
const cors = require('cors');

module.exports = function(app) {

// Direktori untuk file publik
const FILES_DIR = path.join(__dirname, 'public_files');

// --- Middleware ---

// Middleware untuk membuat file publik bisa diakses lewat URL
// Contoh: file 'catatan.txt' bisa diakses di http://localhost:3000/files/catatan.txt
app.use('/files', express.static(FILES_DIR));


// Fungsi untuk memastikan direktori publik ada
const ensureDirExists = async () => {
    try {
        await fs.access(FILES_DIR);
    } catch (error) {
        await fs.mkdir(FILES_DIR, { recursive: true });
    }
};


// --- Rute-rute API ---

// [GET] /api/files - Mendapatkan daftar semua file
app.get('/api/files', async (req, res) => {
    try {
        const files = await fs.readdir(FILES_DIR);
        
        const fileDetails = await Promise.all(
            files.map(async (file) => {
                const stats = await fs.stat(path.join(FILES_DIR, file));
                return {
                    filename: file,
                    size: stats.size,
                    last_modified: stats.mtime,
                    url: `${req.protocol}://${req.get('host')}/files/${file}`
                };
            })
        );

        res.status(200).json({ status: 'success', files: fileDetails });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Gagal membaca daftar file.' });
    }
});

// [GET] /api/files/:filename - Mendapatkan konten satu file
app.get('/api/files/:filename', async (req, res) => {
    const filename = path.basename(req.params.filename); // Keamanan
    const filePath = path.join(FILES_DIR, filename);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        res.status(200).json({
            status: 'success',
            filename: filename,
            content: content
        });
    } catch (error) {
        // Jika file tidak ditemukan
        if (error.code === 'ENOENT') {
            return res.status(404).json({ status: 'error', message: 'File tidak ditemukan.' });
        }
        res.status(500).json({ status: 'error', message: 'Gagal membaca file.' });
    }
});


// [POST] /api/files - Membuat file baru
app.post('/api/files', async (req, res) => {
    const { filename, content } = req.body;

    if (!filename || content === undefined) {
        return res.status(400).json({ status: 'error', message: 'Nama file dan konten wajib diisi.' });
    }

    const safeFilename = path.basename(filename); // Keamanan
    const filePath = path.join(FILES_DIR, safeFilename);

    try {
        // Cek apakah file sudah ada
        await fs.access(filePath);
        return res.status(409).json({ status: 'error', message: 'File dengan nama tersebut sudah ada.' });
    } catch (error) {
        // Jika file belum ada (error 'ENOENT'), lanjutkan
        if (error.code === 'ENOENT') {
            try {
                await fs.writeFile(filePath, content, 'utf-8');
                res.status(201).json({
                    status: 'success',
                    message: 'File berhasil dibuat.',
                    filename: safeFilename,
                    url: `${req.protocol}://${req.get('host')}/files/${safeFilename}`
                });
            } catch (writeError) {
                res.status(500).json({ status: 'error', message: 'Gagal membuat file.' });
            }
        } else {
             res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
        }
    }
});

// [PUT] /api/files/:filename - Mengedit file yang ada
app.put('/api/files/:filename', async (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(FILES_DIR, filename);
    const { content } = req.body;

    if (content === undefined) {
        return res.status(400).json({ status: 'error', message: 'Konten wajib diisi.' });
    }

    try {
        // Cek dulu apakah file ada untuk diedit
        await fs.access(filePath);
        // Timpa file dengan konten baru
        await fs.writeFile(filePath, content, 'utf-8');
        res.status(200).json({ 
            status: 'success', 
            message: 'File berhasil diperbarui.',
            filename: filename 
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ status: 'error', message: 'File tidak ditemukan.' });
        }
        res.status(500).json({ status: 'error', message: 'Gagal memperbarui file.' });
    }
});

// [DELETE] /api/files/:filename - Menghapus file
app.delete('/api/files/:filename', async (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(FILES_DIR, filename);

    try {
        // Cek dulu apakah file ada untuk dihapus
        await fs.access(filePath);
        // Hapus file
        await fs.unlink(filePath);
        res.status(200).json({ status: 'success', message: 'File berhasil dihapus.' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ status: 'error', message: 'File tidak ditemukan.' });
        }
        res.status(500).json({ status: 'error', message: 'Gagal menghapus file.' });
    }
});
}