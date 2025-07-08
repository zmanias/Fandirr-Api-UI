const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

module.exports = function(app, validateApiKey) {

async function imglarger(buffer, options = {}) { const { scale = '2', type = 'upscale' } = options;

const config = {
    scales: ['2', '4'],
    types: { upscale: 13, enhance: 2, sharpener: 1 }
};

if (!Buffer.isBuffer(buffer)) throw new Error('Image buffer is required');
if (!config.types[type]) throw new Error(`Available types: ${Object.keys(config.types).join(', ')}`);
if (type === 'upscale' && !config.scales.includes(scale.toString())) throw new Error(`Available scales: ${config.scales.join(', ')}`);

try {
    const form = new FormData();
    form.append('file', buffer, `img_${Date.now()}.jpg`);
    form.append('type', config.types[type].toString());
    if (!['sharpener'].includes(type)) form.append('scaleRadio', type === 'upscale' ? scale.toString() : '1');

    const { data: p } = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', form, {
        headers: {
            ...form.getHeaders(),
            accept: 'application/json, text/plain, */*',
            origin: 'https://imglarger.com',
            referer: 'https://imglarger.com/',
            'user-agent': 'Mozilla/5.0'
        }
    });
    if (!p.data.code) throw new Error('Upload failed - no code received');

    while (true) {
        const { data: r } = await axios.post('https://photoai.imglarger.com/api/PhoAi/CheckStatus', {
            code: p.data.code,
            type: config.types[type]
        }, {
            headers: {
                accept: 'application/json, text/plain, */*',
                'content-type': 'application/json',
                origin: 'https://imglarger.com',
                referer: 'https://imglarger.com/',
                'user-agent': 'Mozilla/5.0'
            }
        });

        if (r.data.status === 'waiting') continue;
        if (r.data.status === 'success') return r.data.downloadUrls[0];
        await new Promise(res => setTimeout(res, 5000));
    }

} catch (error) {
    console.error(error.message);
    throw new Error(error.message);
}

}

app.get('/imgcreator/imglarger', async (req, res) => { const { imageUrl, scale = '2', type = 'upscale' } = req.query;

if (!imageUrl) return res.status(400).json({ error: 'Parameter imageUrl diperlukan' });

try {
    const filename = `tmp_${uuidv4()}.jpg`;
    const filePath = path.join(__dirname, filename);

    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, imgRes.data);
    const buffer = fs.readFileSync(filePath);

    const resultUrl = await imglarger(buffer, { scale, type });

    fs.unlinkSync(filePath);

    res.json({ downloadUrl: resultUrl });
} catch (err) {
    res.status(500).json({ error: err.message });
}
});
}