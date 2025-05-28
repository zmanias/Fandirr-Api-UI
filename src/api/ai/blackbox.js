const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// Fungsi blackbox yang Anda berikan
async function blackbox(queryText) { // Mengubah nama parameter menjadi queryText agar lebih jelas
    try {
        const { data } = await axios.post(`https://www.blackbox.ai/api/chat`, {
            messages: [
                {
                    role: 'user',
                    content: queryText, // Menggunakan queryText di sini
                    id: null
                }
            ],
            agentMode: {},
            id: null,
            previewToken: null,
            userId: null,
            codeModelMode: true,
            trendingAgentMode: {},
            isMicMode: false,
            userSystemPrompt: null,
            maxTokens: 1024,
            playgroundTopP: null,
            playgroundTemperature: null,
            isChromeExt: false,
            githubToken: '',
            clickedAnswer2: false,
            clickedAnswer3: false,
            clickedForceWebSearch: false,
            visitFromDelta: false,
            isMemoryEnabled: false,
            mobileClient: false,
            userSelectedModel: null,
            validated: '00f37b34-a166-4efb-bce5-1312d87f2f94',
            imageGenerationMode: false,
            webSearchModePrompt: false,
            deepSearchMode: false,
            domains: null,
            vscodeClient: false,
            codeInterpreterMode: false,
            customProfile: {
                name: '',
                occupation: '',
                traits: [],
                additionalInfo: '',
                enableNewChats: false
            },
            webSearchModeOption: {
                autoMode: true,
                webMode: false,
                offlineMode: false
            },
            session: null,
            isPremium: false,
            subscriptionCache: null,
            beastMode: false,
            reasoningMode: false,
            designerMode: false,
            workspaceId: '',
            asyncMode: false
        }, {
            headers: {
                accept: '*/*',
                'content-type': 'application/json',
                origin: 'https://www.blackbox.ai',
                referer: 'https://www.blackbox.ai/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });
        
        return data;
    } catch (error) {
        console.error('Terjadi kesalahan dalam panggilan API Blackbox:', error.message);
        throw new Error('Tidak ada hasil yang ditemukan dari Blackbox AI. Mungkin sedang down atau permintaan Anda salah format.');
    }
}

// Definisikan _endpoint_ API
// Ini akan merespons permintaan GET seperti: http://localhost:3000/api/blackbox?text=your_query_here
app.get('/ai/blackbox', async (req, res) => {
    const inputText = req.query.text; // Mengambil 'text' dari parameter query

    // Validasi dasar
    if (!inputText) {
        return res.status(400).json({
            success: false,
            message: 'Parameter "text" diperlukan. Contoh: /api/blackbox?text=bagaimana+kabar+Anda'
        });
    }

    try {
        const result = await blackbox(inputText); // Meneruskan inputText ke fungsi blackbox
        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error('Kesalahan API:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Terjadi kesalahan saat memproses permintaan Anda.'
        });
    }
});
}