// Impor modul yang dibutuhkan
const express = require('express');
const { fetch } = require('undici');
const cheerio = require('cheerio');

// Inisialisasi aplikasi Express
module.exports = function(app) {

// =================================================================
// KELAS SCRAPER ANDA (Tidak ada perubahan di sini)
// =================================================================
class Xnxx {
    search = async function (query) {
        try {
            const page = Math.floor(3 * Math.random()) + 1;
            const resp = await fetch(`https://www.xnxx.com/search/${query}/${page}`);
            const $ = cheerio.load(await resp.text());
            
            const results = [];
            $('div[id*="video"]').each((_, bkp) => {
                const title = $(bkp).find('.thumb-under p:nth-of-type(1) a').text().trim();
                const views = $(bkp).find('.thumb-under p.metadata span.right').contents().not('span.superfluous').text().trim();
                const resolution = $(bkp).find('.thumb-under p.metadata span.video-hd').contents().not('span.superfluous').text().trim();
                const duration = $(bkp).find('.thumb-under p.metadata').contents().not('span').text().trim();
                const cover = $(bkp).find('.thumb-inside .thumb img').attr('data-src');
                const url = $(bkp).find('.thumb-inside .thumb a').attr('href').replace("/THUMBNUM/", "/");
                
                // Pastikan hanya data yang valid yang ditambahkan
                if (title && url) {
                    results.push({ 
                        title, 
                        views, 
                        resolution, 
                        duration, 
                        cover, 
                        url: `https://xnxx.com${url}`
                    });
                }
            });
            
            return results;
        } catch (error) {
            // Melempar error agar bisa ditangkap oleh route handler
            throw new Error(error.message);
        }
    }
    
    download = async function (url) {
        try {
            const resp = await fetch(url);
            const $ = cheerio.load(await resp.text());
    
            const scriptContent = $('#video-player-bg > script:nth-child(6)').html();
            if (!scriptContent) {
                throw new Error('Script content for video links not found.');
            }

            const extractData = (regex) => (scriptContent.match(regex) || [])[1];
    
            const videos = {
                low: extractData(/html5player\.setVideoUrlLow\('(.*?)'\);/),
                high: extractData(/html5player\.setVideoUrlHigh\('(.*?)'\);/),
                HLS: extractData(/html5player\.setVideoHLS\('(.*?)'\);/)
            };
            
            const thumb = extractData(/html5player\.setThumbUrl\('(.*?)'\);/);
    
            return {
                videos,
                thumb
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

// Buat instance dari kelas
const xnxx = new Xnxx();

// =================================================================
// ROUTE / ENDPOINT API
// =================================================================

// Endpoint untuk Pencarian
app.get('/search/xnxx', async (req, res) => {
    const { q } = req.query; // Ambil query pencarian dari URL, contoh: /search?q=girl

    if (!q) {
        return res.status(400).json({ 
            status: 'error',
            message: 'Query parameter "q" is required.' 
        });
    }

    try {
        const results = await xnxx.search(q);
        res.json({
            status: 'success',
            query: q,
            results: results
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'An internal server error occurred: ' + error.message
        });
    }
});

// Endpoint untuk Download
app.get('/download/xnxx', async (req, res) => {
    const { url } = req.query; // Ambil URL video dari query, contoh: /download?url=...

    if (!url) {
        return res.status(400).json({
            status: 'error',
            message: 'Query parameter "url" is required.'
        });
    }

    try {
        const data = await xnxx.download(url);
        res.json({
            status: 'success',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'An internal server error occurred: ' + error.message
        });
    }
});
}