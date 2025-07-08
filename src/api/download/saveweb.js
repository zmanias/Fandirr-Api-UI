// saveweb-get.js
const express = require('express');
const axios = require('axios');
const app = express();

module.exports = function(app, validateApiKey) {

async function saveweb2zip(url, options = {}) {
    try {
        if (!url) throw new Error('Url is required');
        url = url.startsWith('https://') ? url : `https://${url}`;
        const {
            renameAssets = false,
            saveStructure = false,
            alternativeAlgorithm = false,
            mobileVersion = false
        } = options;

        const { data } = await axios.post('https://copier.saveweb2zip.com/api/copySite', {
            url,
            renameAssets,
            saveStructure,
            alternativeAlgorithm,
            mobileVersion
        }, {
            headers: {
                accept: '*/*',
                'content-type': 'application/json',
                origin: 'https://saveweb2zip.com',
                referer: 'https://saveweb2zip.com/',
                'user-agent': 'Mozilla/5.0'
            }
        });

        while (true) {
            const { data: process } = await axios.get(`https://copier.saveweb2zip.com/api/getStatus/${data.md5}`, {
                headers: {
                    accept: '*/*',
                    'content-type': 'application/json',
                    origin: 'https://saveweb2zip.com',
                    referer: 'https://saveweb2zip.com/',
                    'user-agent': 'Mozilla/5.0'
                }
            });

            if (process.isFinished) {
                return {
                    url,
                    error: {
                        text: process.errorText,
                        code: process.errorCode,
                    },
                    copiedFilesAmount: process.copiedFilesAmount,
                    downloadUrl: `https://copier.saveweb2zip.com/api/downloadArchive/${process.md5}`
                };
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error(error.message);
        throw new Error('No result found');
    }
}

// Endpoint GET
app.get('/download/saveweb', async (req, res) => {
    const { url, renameAssets, saveStructure, alternativeAlgorithm, mobileVersion } = req.query;

    if (!url) return res.status(400).json({ error: 'Parameter ?url= diperlukan' });

    try {
        const result = await saveweb2zip(url, {
            renameAssets: renameAssets === 'true',
            saveStructure: saveStructure === 'true',
            alternativeAlgorithm: alternativeAlgorithm === 'true',
            mobileVersion: mobileVersion === 'true'
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
}