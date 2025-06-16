const express = require('express');
const fetch = require('node-fetch');

module.exports = function(app) {

router.post('/delpanel', async (req, res) => {
  const { domain, plta, pltc, id } = req.body;

  if (!domain || !plta || !pltc) {
    return res.status(400).json({ error: 'Parameter domain, plta, dan pltc wajib diisi.' });
  }

  try {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${plta}`,
    };

    const getServers = await fetch(`${domain}/api/application/servers?page=1`, { method: 'GET', headers });
    const serverResult = await getServers.json();
    const servers = serverResult.data;

    if (!id) {
      if (servers.length < 1) return res.json({ message: 'Tidak ada server bot.' });

      const serverList = await Promise.all(
        servers.map(async (server) => {
          const s = server.attributes;
          const resData = await fetch(`${domain}/api/client/servers/${s.uuid.split('-')[0]}/resources`, {
            method: 'GET',
            headers: { ...headers, Authorization: `Bearer ${pltc}` },
          });
          const statusData = await resData.json();
          const status = statusData.attributes ? statusData.attributes.current_state : s.status;

          return {
            id: s.id,
            name: s.name,
            ram: s.limits.memory == 0 ? 'Unlimited' : `${s.limits.memory}MB`,
            disk: s.limits.disk == 0 ? 'Unlimited' : `${s.limits.disk}MB`,
            cpu: s.limits.cpu == 0 ? 'Unlimited' : `${s.limits.cpu}%`,
            status,
          };
        })
      );

      return res.json({ list: serverList });
    }

    const serverToDelete = servers.find((s) => s.attributes.id === Number(id));
    if (!serverToDelete) return res.status(404).json({ error: 'Server tidak ditemukan.' });

    const name = serverToDelete.attributes.name;
    const nameLower = name.toLowerCase();

    const delServer = await fetch(`${domain}/api/application/servers/${id}`, {
      method: 'DELETE',
      headers,
    });

    const getUsers = await fetch(`${domain}/api/application/users?page=1`, { method: 'GET', headers });
    const userResult = await getUsers.json();
    const users = userResult.data;

    const userToDelete = users.find((u) => u.attributes.first_name.toLowerCase() === nameLower);
    if (userToDelete) {
      await fetch(`${domain}/api/application/users/${userToDelete.attributes.id}`, {
        method: 'DELETE',
        headers,
      });
    }

    return res.json({ success: true, message: `Berhasil menghapus server panel ${name}` });
  } catch (err) {
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.', detail: err.message });
  }
});
}