const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app, validateApiKey) {

// Fungsi delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Endpoint GET: /api/igstalk?username=USERNAME
app.get('/stalk/ig', async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({
      status: false,
      message: 'Parameter "username" wajib diisi. Contoh: /api/igstalk?username=natgeo'
    });
  }

  try {
    const result = await igstalk(username);
    if (!result.status) {
      return res.status(404).json({ status: false, message: result.message });
    }

    const data = result.data;

    const response = {
      status: true,
      username: data.usrname,
      stats: data.status,
      bio: data.desk,
      profile_url: `https://www.instagram.com/${username}`,
      profile_picture: data.pp
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message || 'Terjadi kesalahan internal.' });
  }
});

// Fungsi scraping
async function igstalk(username) {
  const url = `https://insta-stories-viewer.com/${username}/`;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    await delay(7000); // Delay agar tidak ditolak

    const $ = cheerio.load(res.data);
    const nama = $('h1.profile__nickname').clone().children().remove().end().text().trim();
    const status = {
      post: $('span.profile__stats-posts').text().trim() || '0',
      follower: $('span.profile__stats-followers').text().trim() || '0',
      following: $('span.profile__stats-follows').text().trim() || '0'
    };
    const pp = $('img.profile__avatar-pic').attr('src') || null;
    const desk = $('div.profile__description').text().trim() || 'Tidak ada bio';

    if (!nama) throw new Error('User tidak ditemukan');

    return {
      status: true,
      data: {
        usrname: nama,
        status,
        pp,
        desk
      }
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || 'Terjadi kesalahan'
    };
  }
}
}