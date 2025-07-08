const express = require('express');
const axios = require('axios');
const moment = require('moment');

module.exports = function(app) {

app.get('/stalk/ffcek', async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ status: false, message: 'Parameter uid diperlukan' });

  const url = `https://discordbot.freefirecommunity.com/player_info_api?uid=${uid}&region=id`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Origin': 'https://www.freefirecommunity.com',
        'Referer': 'https://www.freefirecommunity.com/ff-account-info/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    const d = response.data.player_info || {};
    const b = d.basicInfo || {};
    const c = d.creditScoreInfo || {};
    const p = d.petInfo || {};
    const prof = d.profileInfo || {};
    const s = d.socialInfo || {};

    const safe = (val, fallback = 'N/A') => val !== undefined && val !== null ? val : fallback;
    const formatTime = (unix) => unix ? moment.unix(unix).format('YYYY-MM-DD HH:mm:ss') : 'N/A';

    const result = {
      nickname: safe(b.nickname),
      accountId: safe(b.accountId),
      region: safe(b.region),
      level: safe(b.level),
      likes: safe(b.liked),
      rank: safe(b.rank),
      maxRank: safe(b.maxRank),
      csRank: safe(b.csRank),
      exp: safe(b.exp),
      createAt: formatTime(b.createAt),
      lastLoginAt: formatTime(b.lastLoginAt),
      rankingPoints: safe(b.rankingPoints),
      releaseVersion: safe(b.releaseVersion),
      seasonId: safe(b.seasonId),
      primeLevel: safe(b.primeLevel?.level, '-'),
      diamondCost: safe(d.diamondCostRes?.diamondCost, '-'),
      pet: {
        name: safe(p.name, '-'),
        level: safe(p.level, '-'),
        exp: safe(p.exp, '-'),
        skinId: safe(p.skinId, '-'),
        skillId: safe(p.selectedSkillId, '-')
      },
      profile: {
        avatarId: safe(prof.avatarId),
        clothes: Array.isArray(prof.clothes) ? prof.clothes : [],
        equippedSkills: Array.isArray(prof.equipedSkills) ? prof.equipedSkills : []
      },
      social: {
        battleTags: Array.isArray(s.battleTag) ? s.battleTag.map((tag, i) => ({
          tag,
          count: s.battleTagCount?.[i] || 0
        })) : [],
        language: safe(s.language),
        rankShow: safe(s.rankShow),
        signature: safe(s.signature)
      },
      creditScore: safe(c.creditScore),
      rewardState: safe(c.rewardState),
      images: {
        banner: `https://discordbot.freefirecommunity.com/banner_image_api?uid=${uid}&region=id`,
        outfit: `https://discordbot.freefirecommunity.com/outfit_image_api?uid=${uid}&region=id`
      }
    };

    res.json({ status: true, uid, data: result });

  } catch (error) {
    console.error('Gagal mengambil data:', error.message);
    res.status(500).json({ status: false, message: 'Gagal mengambil data akun Free Fire' });
  }
});
}