const express = require('express');
const fetch = require('node-fetch');

module.exports = function(app, validateApiKey) {

app.get('/panel/delpanel', async (req, res) => {
  const { domain, plta, pltc, id } = req.query;

  if (!domain || !plta || !pltc) {
    return res.status(400).json({ error: 'Parameter domain, plta, dan pltc wajib diisi' });
  }

  try {
    // Ambil semua server
    const f = await fetch(`${domain}/api/application/servers?page=1`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plta}`,
      },
    });

    const data = await f.json();
    const servers = data.data;

    if (!servers || servers.length < 1) {
      return res.json({ message: 'Tidak ada server panel.' });
    }

    // Jika tidak ada parameter id, tampilkan daftar server
    if (!id) {
      const list = await Promise.all(
        servers.map(async (s) => {
          const attr = s.attributes;

          const resource = await fetch(`${domain}/api/client/servers/${attr.uuid.split('-')[0]}/resources`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${pltc}`,
            },
          });

          const data = await resource.json();
          const status = data?.attributes?.current_state || attr.status;

          return {
            id: attr.id,
            name: attr.name,
            ram: attr.limits.memory === 0 ? 'Unlimited' : `${Math.round(attr.limits.memory / 1024)}GB`,
            cpu: attr.limits.cpu === 0 ? 'Unlimited' : `${attr.limits.cpu}%`,
            disk: attr.limits.disk === 0 ? 'Unlimited' : `${Math.round(attr.limits.disk / 1024)}GB`,
            status,
          };
        })
      );

      return res.json({ serverList: list });
    }

    // Jika ada id, hapus server dan user
    const target = servers.find((s) => parseInt(id) === s.attributes.id);
    if (!target) return res.status(404).json({ error: 'Server panel tidak ditemukan' });

    const name = target.attributes.name.toLowerCase();

    // Hapus server
    await fetch(`${domain}/api/application/servers/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${plta}`,
      },
    });

    // Cari user dengan nama depan = nama server, lalu hapus
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

    return res.json({ message: `Berhasil menghapus server panel ${target.attributes.name}` });
  } catch (error) {
    return res.status(500).json({ error: 'Terjadi kesalahan', details: error.message });
  }
});
}