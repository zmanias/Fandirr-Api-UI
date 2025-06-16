const express = require('express');
const puppeteer = require('puppeteer');

module.exports = function(app) {

app.get('/tools/ssweb', async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

        const buffer = await page.screenshot({ type: 'png' });

        await browser.close();

        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to capture screenshot', detail: error.message });
    }
});
}