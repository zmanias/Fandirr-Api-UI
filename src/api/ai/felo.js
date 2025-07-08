const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { JSDOM } = require('jsdom');

module.exports = function(app, validateApiKey) {

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const resultsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getCacheKey(query) {
  return `felo-${query}`;
}

function clearOldCache() {
  const now = Date.now();
  for (const [key, value] of resultsCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      resultsCache.delete(key);
    }
  }
}

function extractDirectUrl(rawUrl) {
  try {
    if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
    else if (rawUrl.startsWith('/')) rawUrl = 'https://duckduckgo.com' + rawUrl;

    const url = new URL(rawUrl);
    if (url.hostname === 'duckduckgo.com' && url.pathname === '/l/') {
      const real = url.searchParams.get('uddg');
      return real ? decodeURIComponent(real) : rawUrl;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

async function getDuckDuckGoLinks(query, maxResults = 5) {
  try {
    const response = await axios.get(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': getRandomUserAgent() }
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    const results = [];

    const items = document.querySelectorAll('.result__title a');
    for (const item of items) {
      const title = item.textContent.trim();
      const rawUrl = item.getAttribute('href');
      const url = extractDirectUrl(rawUrl);
      if (title && url) {
        results.push(`- ${title} → ${url}`);
        if (results.length >= maxResults) break;
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function felosearch(prompt) {
  clearOldCache();
  const cacheKey = getCacheKey(prompt);
  const cached = resultsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  const payload = {
    query: prompt,
    search_uuid: uuidv4(),
    lang: '',
    agent_lang: 'en',
    search_options: { langcode: 'en-US' },
    search_video: true,
    contexts_from: 'google'
  };

  const headers = {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'origin': 'https://felo.ai',
    'referer': 'https://felo.ai/',
    'user-agent': getRandomUserAgent()
  };

  try {
    const response = await axios.post('https://api.felo.ai/search/threads', payload, {
      headers,
      timeout: 30000,
      responseType: 'stream'
    });

    let resultText = '';
    for await (const chunk of response.data) {
      const lines = chunk.toString().split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(5));
          if (data.type === 'answer' && data.data?.text) {
            resultText = data.data.text;
          }
        } catch {}
      }
    }

    const references = await getDuckDuckGoLinks(prompt);
    let fullResult = resultText || 'No response from Felo';
    if (references.length) {
      fullResult += '\n\n\ud83d\udcda Referensi:\n' + references.join('\n');
    }

    resultsCache.set(cacheKey, { results: fullResult, timestamp: Date.now() });
    return fullResult;
  } catch (err) {
    return `Felo error: ${err.message}`;
  }
}

app.get('/ai/felo', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ status: false, message: 'Parameter query diperlukan.' });
  const result = await felosearch(query);
  res.json({ status: true, result });
});
}