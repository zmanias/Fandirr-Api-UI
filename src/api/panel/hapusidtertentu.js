const express = require('express');
const fetch = require('node-fetch');

module.exports = function(app, validateApiKey) {

app.get('/panel/hapusserverid', async (req, res) => {
  const { domain, plta, pltc, only } = req.query;

  if (!domain || !plta || !pltc) {
    return res.status(400).json({ error: 'Parameter domain, plta, dan pltc wajib diisi' });
  }

  try {
    const response = await fetch(`${domain}/api/application/servers?page=1`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plta}`,
      },
    });

    const data = await response.json();
    const servers = data.data;

    if (!servers || servers.length < 1) {
      return res.json({ message: 'Tidak ada server panel.' });
    }

    const onlyIds = only ? only.split(',').map((id) => parseInt(id.trim())) : [];
    
    const deleted = [];

    for (const server of servers) {
      const attr = server.attributes;
      const serverId = attr.id;

      // Hanya hapus server yang ID nya ada di parameter "only"
      if (!onlyIds.includes(serverId)) continue; // Skip server selain ID yang ditentukan

      const name = attr.name.toLowerCase();

      // Hapus server
      await fetch(`${domain}/api/application/servers/${serverId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`,
        },
      });

      // Hapus user dengan nama depan = nama server
      const usersRes = await fetch(`${domain}/api/application/users?page=1`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`,
        },
      });

      const usersData = await usersRes.json();
      const users = usersData.data;

      const user = users.find((u) => u.attributes.first_name.toLowerCase() === name);
      if (user) {
        await fetch(`${domain}/api/application/users/${user.attributes.id}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${plta}`,
          },
        });
      }

      deleted.push({ id: serverId, name });
    }

    return res.json({ message: 'Berhasil menghapus server-panel', totalDeleted: deleted.length, deleted });
  } catch (error) {
    return res.status(500).json({ error: 'Terjadi kesalahan', details: error.message });
  }
});
}