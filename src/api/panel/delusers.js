const express = require('express');
const fetch = require('node-fetch');

module.exports = function(app) {

app.get('/panel/delusers', async (req, res) => {
  const { domain, plta, except_user } = req.query;

  if (!domain || !plta) {
    return res.status(400).json({ error: 'Parameter domain dan plta wajib diisi' });
  }

  try {
    // Ambil semua user
    const response = await fetch(`${domain}/api/application/users?page=1`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plta}`,
      },
    });

    const data = await response.json();
    const users = data.data;

    if (!users || users.length < 1) {
      return res.json({ message: 'Tidak ada user ditemukan.' });
    }

    // Siapkan list ID yang tidak boleh dihapus
    const whitelistIds = except_user
      ? except_user.split(',').map(id => parseInt(id.trim()))
      : [];

    const deleted = [];

    for (const user of users) {
      const userId = user.attributes.id;

      if (whitelistIds.includes(userId)) continue; // Skip user yang masuk whitelist

      await fetch(`${domain}/api/application/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`,
        },
      });

      deleted.push({ id: userId, email: user.attributes.email });
    }

    return res.json({
      message: 'Berhasil menghapus user.',
      total_deleted: deleted.length,
      deleted
    });

  } catch (error) {
    return res.status(500).json({ error: 'Terjadi kesalahan', details: error.message });
  }
});
}