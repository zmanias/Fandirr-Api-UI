// 1. Impor modul yang dibutuhkan menggunakan 'require'
const express = require('express');
const axios = require('axios');

module.exports = function(app) {

// 3. Definisikan endpoint API
// Rute diubah menjadi /stalkig. Username akan diambil dari query string.
app.get('/stalk/igv2', async (req, res) => {
  // Ambil username dari parameter query URL (?username=...)
  // Ubah dari req.params menjadi req.query
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: true, message: 'Parameter query "username" tidak boleh kosong.' });
  }

  // Logika di dalam try...catch tetap sama persis
  try {
    console.log(`Mencari data untuk profil Instagram: ${username}`);

    // --- Bagian untuk mengambil info profil ---
    const profileFormData = new URLSearchParams();
    profileFormData.append('profile', username);

    const profileRes = await axios.post('https://tools.xrespond.com/api/instagram/profile-info', profileFormData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'origin': 'https://bitchipdigital.com',
        'referer': 'https://bitchipdigital.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });

    const raw = profileRes.data?.data?.data;
    if (!raw || profileRes.data.status !== 'success') {
      return res.status(404).json({ error: true, message: 'Profil tidak ditemukan atau terjadi kesalahan.' });
    }

    const followers = raw.follower_count ?? 0;

    // --- Bagian untuk mengambil postingan ---
    const postsForm = new URLSearchParams();
    postsForm.append('profile', username);

    const postsRes = await axios.post('https://tools.xrespond.com/api/instagram/media/posts', postsForm.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'origin': 'https://bitchipdigital.com',
        'referer': 'https://bitchipdigital.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });

    const items = postsRes.data?.data?.data?.items || [];

    // --- Bagian kalkulasi engagement rate ---
    let totalLike = 0;
    let totalComment = 0;

    for (const post of items) {
      totalLike += post.like_count || 0;
      totalComment += post.comment_count || 0;
    }

    const totalEngagement = totalLike + totalComment;
    const averageEngagementRate = followers > 0 && items.length > 0
      ? ((totalEngagement / items.length) / followers) * 100
      : 0;
    
    // --- Siapkan hasil akhir ---
    const result = {
      username: raw.username || '-',
      name: raw.full_name || '-',
      bio: raw.biography || '-',
      followers,
      following: raw.following_count ?? null,
      posts: raw.media_count ?? null,
      profile_pic: raw.hd_profile_pic_url_info?.url || raw.profile_pic_url_hd || '',
      verified: raw.is_verified || raw.show_blue_badge_on_main_profile || false,
      engagement_rate: parseFloat(averageEngagementRate.toFixed(2))
    };

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Terjadi kesalahan internal pada server.' });
  }
});
}