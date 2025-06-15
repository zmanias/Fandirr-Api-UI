const express = require('express');
const axios = require('axios');
const cors = require('cors');

module.exports = function(app) {

// ==================== FREEPIK FUNCTIONS ====================
const freepik = {
  search: async (q) => {
    if (!q) throw new Error('Query is required');
    const { data } = await axios.get(`https://www.freepik.com/api/regular/search?filters[ai-generated][excluded]=1&filters[content_type]=photo&locale=en&page=${Math.floor(Math.random() * 100) + 1}&term=${encodeURIComponent(q)}`, {
      headers: { 'user-agent': 'Mozilla/5.0' }
    });

    return data.items.map(res => ({
      title: res.name,
      type: res.type,
      is_premium: res.premium,
      is_aigenerated: res.isAIGenerated,
      author: {
        name: res.author.name,
        avatar: res.author.avatar,
        url: `https://www.freepik.com/author/${res.author.slug}`
      },
      previewUrl: res.preview.url,
      url: res.url
    }));
  },

  detail: async (url) => {
    const id = url.match(/_(\d+)\.htm$/)?.[1];
    if (!id) throw new Error('Invalid URL');

    const { data } = await axios.get(`https://www.freepik.com/api/resources/${id}?locale=en`, {
      headers: { 'user-agent': 'Mozilla/5.0' }
    });

    const d = new Date(data.created);
    return {
      title: data.name,
      type: data.type,
      mimetype: data.encodingFormat,
      is_premium: data.premium,
      is_aigenerated: data.isAIGenerated,
      relatedTags: data.relatedTags.map(tag => tag.name),
      author: {
        name: data.author.name,
        avatar: data.author.avatar,
        url: `https://www.freepik.com/author/${data.author.slug}`
      },
      previewUrl: data.preview.url,
      licenseUrl: data.license,
      created: `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
    };
  },

  download: async (url) => {
    const id = url.match(/_(\d+)\.htm$/)?.[1];
    if (!id) throw new Error('Invalid URL');

    const { data } = await axios.get(`https://www.freepik.com/api/regular/download?resource=${id}&action=download&locale=en`, {
      headers: { 'user-agent': 'Mozilla/5.0' }
    });

    return data;
  }
};

// ==================== ENDPOINT ROUTES ====================

// Search: /api/freepik/search?q=design
app.get('/search/freepik', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Parameter q wajib diisi' });
    const result = await freepik.search(q);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detail: /api/freepik/detail?url=https://www.freepik.com/free-photo/...
app.get('/stalk/freepik', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Parameter url wajib diisi' });
    const result = await freepik.detail(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download: /api/freepik/download?url=https://www.freepik.com/free-photo/...
app.get('/api/freepik/download', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Parameter url wajib diisi' });
    const result = await freepik.download(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}