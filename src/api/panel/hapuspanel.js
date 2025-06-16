const express = require('express');
const fetch = require('node-fetch');

module.exports = function(app) {

app.post('/panel/delpanel', async (req, res) => {
  const { domain, plta, pltc, id } = req.body;

  if (!domain || !plta || !pltc) {
    return res.status(400).json({ error: 'Parameter domain, plta, dan pltc wajib diisi' });
  }

  // Jika tidak ada ID, tampilkan list panel
  if (!id) {
    try {
      const panelRes = await fetch(`${domain}/api/application/servers?page=1`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`,
        },
      });

      const panelData = await panelRes.json();
      const servers = panelData.data;

      if (!servers || servers.length < 1) {
        return res.json({ message: 'Tidak ada server panel.' });
      }

      const list = await Promise.all(
        servers.map(async (server) => {
          const s = server.attributes;

          const resourceRes = await fetch(`${domain}/api/client/servers/${s.uuid.split('-')[0]}/resources`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${pltc}`,
            },
          });

          const resourceData = await resourceRes.json();
          const status = resourceData?.attributes?.current_state || s.status;

          return {
            id: s.id,
            name: s.name,
            ram: s.limits.memory === 0 ? 'Unlimited' : `${Math.round(s.limits.memory / 1024)}GB`,
            cpu: s.limits.cpu === 0 ? 'Unlimited' : `${s.limits.cpu}%`,
            disk: s.limits.disk === 0 ? 'Unlimited' : `${Math.round(s.limits.disk / 1024)}GB`,
            status,
          };
        })
      );

      return res.json({ serverList: list });
    } catch (err) {
      return res.status(500).json({ error: 'Gagal mengambil data server panel', details: err.message });
    }
  }

  // Jika ada ID, hapus server dan user terkait
  try {
    const serversRes = await fetch(`${domain}/api/application/servers?page=1`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plta}`,
      },
    });

    const serversData = await serversRes.json();
    const servers = serversData.data;

    let foundServer;
    let serverName;

    for (const server of servers) {
      const s = server.attributes;
      if (parseInt(id) === s.id) {
        foundServer = s;
        serverName = s.name;
        break;
      }
    }

    if (!foundServer) return res.status(404).json({ error: 'Server panel tidak ditemukan!' });

    // Hapus server
    await fetch(`${domain}/api/application/servers/${foundServer.id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plta}`,
      },
    });

    // Cari dan hapus user
    const usersRes = await fetch(`${domain}/api/application/users?page=1`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plta}`,
      },
    });

    const usersData = await usersRes.json();
    const users = usersData.data;
    const targetUser = users.find(
      (user) => user.attributes.first_name.toLowerCase() === foundServer.name.toLowerCase()
    );

    if (targetUser) {
      await fetch(`${domain}/api/application/users/${targetUser.attributes.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${plta}`,
        },
      });
    }

    return res.json({ message: `Berhasil menghapus server panel ${serverName}` });
  } catch (error) {
    return res.status(500).json({ error: 'Terjadi kesalahan saat menghapus server panel', details: error.message });
  }
});
}