const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

  // Fungsi scraping data CapCut
  async function scrapeCapcutStalk(url) {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
      },
    });

    const $ = cheerio.load(data);

    const username = $('h1.title-pYC_U9').text().trim();
    const stats = $('div.achieveItem-wjNBbI span.count-qWlNP9').map((i, el) => $(el).text()).get();
    const description = $('div.desc-wvyE3k').text().trim();

    const templates = [];
    $('.verticalLayout-sDNbmV').each((i, el) => {
      const title = $(el).find('.titleBox-BXSEc3').text().trim();
      const views = $(el).find('.cut-label .text').text().trim();
      const date = $(el).find('.tips-TuKRyG').text().trim();
      const thumb = $(el).find('.pictureImg-kT3IMQ').attr('src');
      const link = 'https://www.capcut.com' + $(el).find('a').first().attr('href');

      templates.push({ title, views, date, thumb, link });
    });

    return {
      username,
      followers: stats[1],
      likes: stats[2],
      description,
      templates
    };
  }

  // Endpoint REST API
  app.get('/stalk/capcut', async (req, res) => {
    const { url } = req.query;

    if (!url || !url.includes('capcut.com')) {
      return res.status(400).json({ error: 'URL CapCut tidak valid!' });
    }

    try {
      const result = await scrapeCapcutStalk(url);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Gagal mengambil data dari CapCut',
        details: error.message
      });
    }
  });
};