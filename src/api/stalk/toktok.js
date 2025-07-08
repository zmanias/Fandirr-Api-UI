const express = require('express');
const axios = require('axios');

module.exports = function(app) {

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
};

// Endpoint: GET /api/tokviewer/profile?username=...
app.get('/stalk/tt/profile', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ status: false, error: 'Parameter username diperlukan' });

  try {
    const { data } = await axios.post(
      'https://tokviewer.net/api/check-profile',
      { username },
      { headers }
    );

    if (data.status !== 200 || !data.data) {
      return res.json({ status: false, error: 'Profil tidak ditemukan' });
    }

    res.json({
      status: true,
      username,
      avatar: data.data.avatar,
      followers: data.data.followers,
      following: data.data.following,
      likes: data.data.likes
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Endpoint: GET /api/tokviewer/posts?username=...&offset=0&limit=5
app.get('/stalk/tt/post', async (req, res) => {
  const { username, offset = 0, limit = 10 } = req.query;
  if (!username) return res.status(400).json({ status: false, error: 'Parameter username diperlukan' });

  try {
    const { data } = await axios.post(
      'https://tokviewer.net/api/video',
      { username, offset: parseInt(offset), limit: parseInt(limit) },
      { headers }
    );

    if (data.status !== 200 || !Array.isArray(data.data)) {
      return res.json({ status: false, error: 'Tidak ada postingan ditemukan' });
    }

    const videos = data.data.map(item => {
      const stats = item.statistics || {};
      return {
        id: item.aweme_id || item.id || '',
        caption: item.desc || '',
        video_url: item.video?.bit_rate?.[0]?.play_addr?.url_list?.[0] || '',
        create_time: item.create_time || '',
        like_count: stats.digg_count || 0,
        comment_count: stats.comment_count || 0,
        share_count: stats.share_count || 0,
        play_count: stats.play_count || 0,
        tiktok_link: item.share_url || `https://www.tiktok.com/@${username}/video/${item.aweme_id}`
      };
    });

    res.json({ status: true, total: videos.length, videos });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});
}