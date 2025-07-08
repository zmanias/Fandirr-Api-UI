const express = require("express");
const fetch = require("node-fetch");

module.exports = function(app, validateApiKey) {

app.get("/panel/listpanel", async (req, res) => {
  const { domain, plta, pltc } = req.query;

  if (!domain || !plta || !pltc) {
    return res.status(400).json({
      error: "Parameter 'domain', 'plta', dan 'pltc' wajib diisi!",
    });
  }

  const domainUrl = domain.startsWith("http") ? domain : `https://${domain}`;

  try {
    const serverRes = await fetch(`${domainUrl}/api/application/servers?page=1`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${plta}`,
      },
    });

    const serverJson = await serverRes.json();
    const servers = serverJson.data;

    if (!servers || servers.length < 1) {
      return res.json({ message: `❌ Tidak ada server panel ditemukan.` });
    }

    let messageText = `📋 List Server Panel\n`;

    for (const server of servers) {
      const s = server.attributes;

      const resourceRes = await fetch(`${domainUrl}/api/client/servers/${s.uuid.split("-")[0]}/resources`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${pltc}`,
        },
      });

      const resourceData = await resourceRes.json();
      const status = resourceData?.attributes?.current_state || s.status;

      const toGB = (val) => {
        if (val === 0) return "Unlimited";
        return val >= 1000 ? `${Math.floor(val / 1000)}GB` : `${val}MB`;
      };

      messageText += `\n🆔 ID        : ${s.id}\n📛 Nama      : ${s.name}\n📦 Ram       : ${toGB(s.limits.memory)}\n💽 Disk      : ${toGB(s.limits.disk)}\n🧠 CPU       : ${s.limits.cpu === 0 ? "Unlimited" : s.limits.cpu + "%"}\n📅 Created   : ${s.created_at.split("T")[0]}\n⚙️ Status    : ${status}\n`;
    }

    return res.json({ message: messageText.trim() });
  } catch (err) {
    return res.status(500).json({
      error: "Terjadi kesalahan",
      detail: err.message,
    });
  }
});
}