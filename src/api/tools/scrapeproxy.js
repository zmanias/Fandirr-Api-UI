// server.js

// 1. Impor library yang dibutuhkan
const express = require('express');
const puppeteer = require('puppeteer');

module.exports = function(app) {

// 3. Definisikan endpoint /tools/scrape-proxy
app.get('/tools/scrape-proxy', async (req, res) => {
    // Ambil URL target dari query parameter
    const targetUrl = req.query.url;

    // Validasi: Pastikan URL diberikan
    if (!targetUrl) {
        return res.status(400).json({ 
            success: false, 
            message: 'Parameter "url" wajib diisi.' 
        });
    }

    // Validasi: Pastikan format URL benar
    try {
        new URL(targetUrl);
    } catch (error) {
        return res.status(400).json({ 
            success: false, 
            message: 'Format URL tidak valid.' 
        });
    }

    let browser = null;
    try {
        // Luncurkan browser Puppeteer
        // Opsi '--no-sandbox' seringkali dibutuhkan saat berjalan di server/VPS
        browser = await puppeteer.launch({
            headless: true, // Berjalan di background tanpa membuka jendela browser
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Atur User-Agent agar terlihat seperti browser biasa
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
        );

        // Kunjungi URL target
        // 'networkidle2' menunggu sampai koneksi jaringan hampir selesai, memastikan halaman (termasuk JS) termuat
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Ambil seluruh konten HTML dari halaman tersebut
        const htmlContent = await page.content();

        // Kirimkan HTML sebagai respons dalam format JSON
        res.json({
            success: true,
            html: htmlContent
        });

    } catch (error) {
        console.error("Scraping error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengambil data halaman.',
            error: error.message 
        });
    } finally {
        // Pastikan browser selalu ditutup untuk menghindari kebocoran memori
        if (browser) {
            await browser.close();
        }
    }
});
}