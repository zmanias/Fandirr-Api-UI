import express from 'express';
import axios from 'axios';

module.exports = function(app) {

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
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        while (true) {
            const { data: process } = await axios.get(`https://copier.saveweb2zip.com/api/getStatus/${data.md5}`, {
                headers: {
                    accept: '*/*',
                    'content-type': 'application/json',
                    origin: 'https://saveweb2zip.com',
                    referer: 'https://saveweb2zip.com/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
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

app.post('/download/saveweb', async (req, res) => {
    const { url, options } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Missing "url" parameter.' });
    }

    try {
        const result = await saveweb2zip(url, options || {});
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
}