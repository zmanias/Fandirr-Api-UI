const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

async function igstalkv2(query) {
  const endpoint = 'https://privatephotoviewer.com/wp-json/instagram-viewer/v1/fetch-profile';
  const payload = { find: query };
  const headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://privatephotoviewer.com/'
  };

  const { data } = await axios.post(endpoint, payload, { headers });
  const html = data.html;
  const $ = cheerio.load(html);

  let profilePic = $('#profile-insta').find('.col-md-4 img').attr('src');
  if (profilePic && profilePic.startsWith('//')) {
    profilePic = 'https:' + profilePic;
  }
  const name = $('#profile-insta').find('.col-md-8 h4.text-muted').text().trim();
  const username = $('#profile-insta').find('.col-md-8 h5.text-muted').text().trim();
  const stats = {};

  $('#profile-insta')
    .find('.col-md-8 .d-flex.justify-content-between.my-3 > div')
    .each((i, el) => {
      const statValue = $(el).find('strong').text().trim();
      const statLabel = $(el).find('span.text-muted').text().trim().toLowerCase();
      if (statLabel.includes('posts')) stats.posts = statValue;
      if (statLabel.includes('followers')) stats.followers = statValue;
      if (statLabel.includes('following')) stats.following = statValue;
    });

  const bio = $('#profile-insta').find('.col-md-8 p').text().trim();

  return {
    name,
    username,
    profilePic,
    posts: stats.posts,
    followers: stats.followers,
    following: stats.following,
    bio
  };
app.get('/stalk/ig', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ success: false, message: 'Masukkan parameter ?username=' });

  try {
    const data = await igstalkv2(username);
    res.json({ success: true, result: data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data akun Instagram.' });
  }
});
}