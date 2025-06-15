const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

module.exports = function(app) {
const app = express();
const baseUrl = 'https://an1.com/';

async function scrapeAn1(searchQuery) {
  const results = [];

  try {
    const queryParams = new URLSearchParams({
      story: searchQuery,
      do: 'search',
      subaction: 'search'
    });
    const url = `${baseUrl}?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    $('.app_list .item_app').each((i, el) => {
      const name = $(el).find('.name a span').text().trim();
      const linkDetail = $(el).find('.name a').attr('href');
      const developer = $(el).find('.developer').text().trim();
      const ratingStyle = $(el).find('.rate_star .current-rating').attr('style');

      let rating = null;
      if (ratingStyle) {
        const match = ratingStyle.match(/width:(\d+)%/);
        if (match) {
          rating = (parseInt(match[1], 10) / 20).toFixed(1);
        }
      }

      let thumbnail = $(el).find('.img img').attr('src');
      if (thumbnail && thumbnail.startsWith('/')) {
        thumbnail = new URL(thumbnail, baseUrl).href;
      }

      results.push({ name, linkDetail, developer, rating, thumbnail });
    });

    return results;
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}

app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter is required' });

  try {
    const data = await scrapeAn1(query);
    res.json({ count: data.length, results: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scrape data' });
  }
});
}