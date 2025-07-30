const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

module.exports = function(app) {

// =======================================================
// FUNGSI INTI DARI KODE ANDA
// =======================================================

async function nowchat(question) {
    const t = Date.now().toString();
    const s = 'dfaugf098ad0g98-idfaugf098ad0g98-iduoafiunoa-f09a8s098a09ea-a0s8g-asd8g0a9d--gasdga8d0g8a0dg80a9sd8g0a9d8gduoafiunoa-f09adfaugf098ad0g98-iduoafiunoa-f09a8s098a09ea-a0s8g-asd8g0a9d--gasdga8d0g8a0dg80a9sd8g0a9d8g8s098a09ea-a0s8g-asd8g0a9d--gasdga8d0g8a0dg80a9sd8g0a9d8g';
    const k = crypto.createHmac('sha512', s).update(t).digest('base64');
    const data = JSON.stringify({ content: question });

    const config = {
        method: 'POST',
        url: 'http://aichat.nowtechai.com/now/v1/ai',
        headers: {
            'User-Agent': 'Ktor client',
            'Connection': 'Keep-Alive',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/json',
            'Key': k,
            'TimeStamps': t,
            'Accept-Charset': 'UTF-8'
        },
        data,
        responseType: 'stream'
    };

    return new Promise((resolve, reject) => {
        axios.request(config).then(res => {
            let result = '';
            res.data.on('data', chunk => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const json = JSON.parse(line.replace('data: ', ''));
                            const c = json?.choices?.[0]?.delta?.content;
                            if (c) result += c;
                        } catch {}
                    }
                }
            });
            res.data.on('end', () => resolve(result.trim()));
            res.data.on('error', err => reject(new Error('Stream error: ' + err.message)));
        }).catch(err => {
            const errorMessage = err.response?.data?.toString() || err.message;
            reject(new Error('Request failed: ' + errorMessage));
        });
    });
}

async function nowart(prompt) {
    try {
        const res = await axios.get('http://art.nowtechai.com/art?name=' + encodeURIComponent(prompt), {
            headers: {
                'User-Agent': 'okhttp/5.0.0-alpha.9',
                'Connection': 'Keep-Alive',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'Content-Type': 'application/json'
            }
        });
        return res.data;
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        throw new Error('Gagal generate gambar: ' + errorMessage);
    }
}


// =======================================================
// ENDPOINT REST API
// =======================================================

// Endpoint untuk AI Chat
app.get('/ai/nowchat', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ status: 'error', message: 'Query parameter "q" (question) wajib diisi.' });
    }
    try {
        const response = await nowchat(q);
        res.json({ status: 'success', response: response });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint untuk AI Art Generator
app.get('/ai/nowartimg', async (req, res) => {
    const { prompt } = req.query;
    if (!prompt) {
        return res.status(400).json({ status: 'error', message: 'Query parameter "prompt" wajib diisi.' });
    }
    try {
        const result = await nowart(prompt);
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});
}