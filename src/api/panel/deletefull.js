const express = require("express");
const fetch = require("node-fetch");

module.exports = function(app) {

app.get("/panel/deletefull", async (req, res) => {
  const { domain, plta, skipServer, skipUser } = req.query;

  if (!domain || !plta || !skipServer || !skipUser) {
    return res.status(400).json({
      error: "Parameter domain, plta, skipServer, dan skipUser wajib diisi",
    });
  }

  try {
    // ==================== DELETE SERVERS ====================
    const serverRes = await fetch(`${domain}/api/application/servers?page=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
        Accept: "application/json",
      },
    });
    const serverData = await serverRes.json();

    const deletedServers = [];
    for (const server of serverData.data) {
      const sid = server.attributes.id;
      if (String(sid) !== String(skipServer)) {
        await fetch(`${domain}/api/application/servers/${sid}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${plta}`,
            Accept: "application/json",
          },
        });
        deletedServers.push(sid);
      }
    }

    // ==================== DELETE USERS ====================
    const userRes = await fetch(`${domain}/api/application/users?page=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
        Accept: "application/json",
      },
    });
    const userData = await userRes.json();

    const deletedUsers = [];
    for (const user of userData.data) {
      const uid = user.attributes.id;
      if (String(uid) !== String(skipUser)) {
        await fetch(`${domain}/api/application/users/${uid}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${plta}`,
            Accept: "application/json",
          },
        });
        deletedUsers.push(uid);
      }
    }

    res.json({
      success: true,
      deleted_servers: deletedServers,
      deleted_users: deletedUsers,
    });
  } catch (error) {
    res.status(500).json({
      error: "Terjadi kesalahan saat menghapus",
      details: error.message,
    });
  }
});
}