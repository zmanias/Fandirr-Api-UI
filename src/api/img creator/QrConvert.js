const express = require('express');
const qr = require('qr-image');

module.exports = function(app) {
// Middleware express.json() tidak lagi diperlukan untuk endpoint GET ini
// app.use(express.json()); 

/**
 * Fungsi untuk mem-parsing string QRIS dengan format TLV (Tag-Length-Value).
 */
function parseQrisString(qrisString) {
    const data = {};
    let i = 0;
    while (i < qrisString.length) {
        const tag = qrisString.substring(i, i + 2);
        if (i + 4 > qrisString.length) break;
        
        const length = parseInt(qrisString.substring(i + 2, i + 4), 10);
        if (i + 4 + length > qrisString.length) break;

        const value = qrisString.substring(i + 4, i + 4 + length);
        data[tag] = value;
        i += 4 + length;
    }
    return data;
}

/**
 * Fungsi untuk menghitung CRC-16/CCITT-FALSE
 */
function calculateCRC16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    return ('0000' + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

// UBAH DARI app.post MENJADI app.get
app.get('/imgcreator/qrconvert', async (req, res) => {
    // UBAH DARI req.body MENJADI req.query
    const { static_qris, amount, order_id } = req.query;

    if (!static_qris || !amount || !order_id) {
        return res.status(400).send("Parameter 'static_qris', 'amount', dan 'order_id' dibutuhkan di URL.");
    }

    try {
        const staticData = parseQrisString(static_qris);
        
        const merchantInfoBlock = staticData['26'] ? parseQrisString(staticData['26']) : null;
        if (!merchantInfoBlock || !merchantInfoBlock['01']) {
             return res.status(400).send("NMID tidak ditemukan dalam QRIS statis.");
        }

        const merchantData = {
            NMID: merchantInfoBlock['01'],
            MERCHANT_NAME: staticData['59'] || 'MERCHANT NAME',
            MERCHANT_CITY: staticData['60'] || 'CITY'
        };

        const createTLV = (tag, value) => `${tag}${('0' + value.length).slice(-2)}${value}`;
        
        let dynamicPayload = '';
        dynamicPayload += createTLV('00', '01');
        dynamicPayload += createTLV('01', '12');
        
        const newMerchantInfoContent = 
            createTLV('00', 'ID.CO.QRIS.WWW') +
            createTLV('01', merchantData.NMID);
        dynamicPayload += createTLV('26', newMerchantInfoContent);

        dynamicPayload += createTLV('52', staticData['52'] || '0000');
        dynamicPayload += createTLV('53', '360');
        dynamicPayload += createTLV('54', amount.toString());
        dynamicPayload += createTLV('58', 'ID');
        dynamicPayload += createTLV('59', merchantData.MERCHANT_NAME);
        dynamicPayload += createTLV('60', merchantData.MERCHANT_CITY);
        dynamicPayload += createTLV('62', createTLV('01', order_id));
        dynamicPayload += '6304';

        const finalPayload = dynamicPayload + calculateCRC16(dynamicPayload);

        const qrImage = qr.image(finalPayload, { type: 'png', margin: 4, size: 10 });
        res.setHeader('Content-type', 'image/png');
        qrImage.pipe(res);

    } catch (e) {
        console.error(e);
        res.status(500).send('Gagal memproses QRIS.');
    }
});
}