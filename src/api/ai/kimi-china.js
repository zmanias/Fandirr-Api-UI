// Impor modul yang dibutuhkan
const express = require('express');
const axios = require('axios');

// Inisialisasi aplikasi Express
module.exports = function(app) {

// =================================================================
// KELAS KIMI ANDA (Tidak ada perubahan di sini)
// =================================================================
class Kimi {
    constructor() {
        this.id = String(Date.now()) + Math.floor(Math.random() * 1e3);
        this.headers = {
            'content-type': 'application/json',
            'x-language': 'zh-CN',
            'x-msh-device-id': this.id,
            'x-msh-platform': 'web',
            'x-msh-session-id': String(Date.now()) + Math.floor(Math.random() * 1e3),
            'x-traffic-id': this.id
        };
    }
    
    register = async function () {
        try {
            const rynn = await axios.post('https://www.kimi.com/api/device/register', {}, {
                headers: this.headers
            });
            
            return {
                auth: `Bearer ${rynn.data.access_token}`,
                cookie: rynn.headers['set-cookie'].join('; ')
            };
        } catch (error) {
            console.error(error.message);
            return false
        }
    }
    
    chat = async function (question, { model = 'k2', search = true, deep_research = false } = {}) {
        try {
            if (!question) throw new Error('Question is required');
            if (!['k1.5', 'k2'].includes(model)) throw new Error(`Available models: k1.5, k2`);
            if (typeof search !== 'boolean') throw new Error('Search must be boolean');
            if (typeof deep_research !== 'boolean') throw new Error('Deep Research must be boolean');
            
            const reg = await this.register();
            if (!reg) throw new Error('Failed to get token');
            
            const { data: chat } = await axios.post('https://www.kimi.com/api/chat', {
                name: '未命名会话',
                born_from: 'home',
                kimiplus_id: 'kimi',
                is_example: false,
                source: 'web',
                tags: []
            }, {
                headers: {
                    authorization: reg.auth,
                    cookie: reg.cookie,
                    ...this.headers
                }
            });
            
            const { data } = await axios.post(`https://www.kimi.com/api/chat/${chat.id}/completion/stream`, {
                kimiplus_id: 'kimi',
                extend: {
                    sidebar: true
                },
                model: model,
                use_search: search,
                messages: [
                    {
                        role: 'user',
                        content: question
                    }
                ],
                refs: [],
                history: [],
                scene_labels: [],
                use_semantic_memory: false,
                use_deep_research: deep_research
            }, {
                headers: {
                    authorization: reg.auth,
                    cookie: reg.cookie,
                    ...this.headers
                },
                responseType: 'stream'
            });
            
            return new Promise((resolve, reject) => {
                let responseData = '';
                data.on('data', chunk => {
                    responseData += chunk.toString();
                });

                data.on('end', () => {
                    const result = {
                        text: '',
                        search_by: [],
                        sources: [],
                        citations: []
                    };
                    
                    const lines = responseData.split('\n\n');
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            try {
                                const d = JSON.parse(line.substring(6));
                                if (d.event === 'cmpl') result.text += d.text;
                                if (d.event === 'search_plus' && d.msg?.type === 'target') result.search_by = d.msg.targets;
                                if (d.event === 'search_plus' && d.type === 'get_res') result.sources.push(d.msg);
                                if (d.event === 'search_citation') result.citations = Object.values(d.values);
                            } catch (e) {
                                // Abaikan error parsing
                            }
                        }
                    }
                    resolve(result);
                });

                data.on('error', err => {
                    reject(err);
                });
            });

        } catch (error) {
            throw new Error(error.message);
        }
    }
}

// =================================================================
// PERUBAHAN DI SINI: DARI POST MENJADI GET
// =================================================================
app.get('/ai/kimi', async (req, res) => {
    // Ambil data dari query parameter URL, bukan dari body
    const { question, model, search, deep_research } = req.query;

    if (!question) {
        return res.status(400).json({
            status: 'error',
            message: 'Query parameter "question" is required.'
        });
    }

    try {
        const kimi = new Kimi();
        
        // Parsing string 'true'/'false' dari query menjadi boolean
        const use_search = search ? search.toLowerCase() === 'true' : true;
        const use_deep_research = deep_research ? deep_research.toLowerCase() === 'true' : false;

        const options = {
            model: model || 'k2',
            search: use_search,
            deep_research: use_deep_research
        };

        const result = await kimi.chat(question, options);
        
        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'An internal server error occurred: ' + error.message
        });
    }
});
}