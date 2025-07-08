const fs = require('fs');
const express = require('express');
const axios = require('axios');
const FormData = require('form-data'); 
const QRCode = require('qrcode');
const cors = require('cors');
const path = require('path');

module.exports = function(app, validateApiKey) {

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());

function convertCRC16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

function generateTransactionId() {
    return 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateExpirationTime() {
    const t = new Date();
    t.setMinutes(t.getMinutes() + 5);
    return t;
}

function saveTempFile(buffer) {
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.png`);
    fs.writeFileSync(tempFilePath, buffer);
    return tempFilePath;
}

async function uploadToCatBox(filePath) {
    const data = new FormData();
    data.append('reqtype', 'fileupload');
    data.append('fileToUpload', fs.createReadStream(filePath));

    const res = await axios.post('https://catbox.moe/user/api.php', data, {
        headers: {
            ...data.getHeaders(),
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
        }
    });

    return res.data;
}

async function createQRIS(amount, codeqr) {
    let qrisData = codeqr.slice(0, -4);
    const step1 = qrisData.replace("010211", "010212");
    const step2 = step1.split("5802ID");

    amount = amount.toString();
    const uang = "54" + ("0" + amount.length).slice(-2) + amount + "5802ID";
    const finalQris = step2[0] + uang + step2[1] + convertCRC16(step2[0] + uang + step2[1]);

    const buffer = await QRCode.toBuffer(finalQris);
    const filePath = saveTempFile(buffer);
    const url = await uploadToCatBox(filePath);
    fs.unlinkSync(filePath);

    return {
        transactionId: generateTransactionId(),
        amount,
        expirationTime: generateExpirationTime(),
        qrImageUrl: url,
    };
}

// QRIS Payment Endpoint
app.get('/api/orkut/createpayment', async (req, res, validateApiKey) => {
    const { amount, codeqr } = req.query;

    if (!amount || !codeqr) {
        return res.status(400).json({
            status: false,
            error: 'Parameter "amount" dan "codeqr" wajib diisi.',
        });
    }

    try {
        const qrData = await createQRIS(amount, codeqr);
        res.json({
            status: true,
            creator: "Fandirr-Store",
            result: qrData,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
});

// Check Status Endpoint
app.get('/api/orkut/cekstatus', async (req, res, validateApiKey) => {
    const { merchant, keyorkut } = req.query;
    if (!merchant || !keyorkut) {
        return res.status(400).json({
            error: "Isi parameter merchant dan keyorkut",
        });
    }

    try {
        const url = `https://www.gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
        const { data } = await axios.get(url);
        const latest = data?.data?.[0] || null;
        res.json(latest || { message: "No transactions found." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
}