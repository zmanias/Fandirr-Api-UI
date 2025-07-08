const express = require('express');
const { fetch } = require('undici');
const cheerio = require('cheerio');

module.exports = function(app, validateApiKey) {

class Xnxx {
  async search(query) {
    try {
      const page = Math.floor(3 * Math.random()) + 1;
      const resp = await fetch(`https://www.xnxx.com/search/${query}/${page}`);
      const $ = cheerio.load(await resp.text());

      const results = [];
      $('div[id*="video"]').each((_, bkp) => {
        const title = $(bkp).find('.thumb-under p:nth-of-type(1) a').text().trim();
        const views = $(bkp).find('.thumb-under p.metadata span.right').contents().not('span.superfluous').text().trim();
        const resolution = $(bkp).find('.thumb-under p.metadata span.video-hd').contents().not('span.superfluous').text().trim();
        const duration = $(bkp).find('.thumb-under p.metadata').contents().not('span').text().trim();
        const cover = $(bkp).find('.thumb-inside .thumb img').attr('data-src');
        const url = $(bkp).find('.thumb-inside .thumb a').attr('href')?.replace("/THUMBNUM/", "/");

        if (url) {
          results.push({
            title,
            views,
            resolution,
            duration,
            cover,
            url: `https://xnxx.com${url}`
          });
        }
      });

      return results;
    } catch (error) {
      console.error(error.message);
      throw new Error('No result found');
    }
  }

  download = async function (url) {
        try {
            const resp = await fetch(url);
            const $ = cheerio.load(await resp.text());
    
            const scriptContent = $('#video-player-bg > script:nth-child(6)').html();
            const extractData = (regex) => (scriptContent.match(regex) || [])[1];
    
            const videos = {
                low: extractData(/html5player\.setVideoUrlLow\('(.*?)'\);/),
                high: extractData(/html5player\.setVideoUrlHigh\('(.*?)'\);/),
                HLS: extractData(/html5player\.setVideoHLS\('(.*?)'\);/)
            }
            
            const thumb = extractData(/html5player\.setThumbUrl\('(.*?)'\);/)
    
            return {
                videos,
                thumb
            };
        } catch (error) {
            console.error(error.message);
            throw new Error('No result found');
        }
    }
}

const xnxx = new Xnxx();

app.get('/search/xnxx', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Parameter "q" wajib diisi.' });

  try {
    const results = await xnxx.search(q);
    res.json({ query: q, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/download/xnxx', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parameter "url" wajib diisi.' });

  try {
    const data = await xnxx.download(url);
    res.json({ url, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
}