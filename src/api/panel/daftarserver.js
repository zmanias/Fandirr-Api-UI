const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

module.exports = function(app) {

router.get("/panel/listserver", async (req, res) => {
  try {
    const { index, domain, plta, pltc } = req.query;

    if (!index || !domain || !plta || !pltc) {
      return res.status(400).json({ error: "Param index, domain, plta, dan pltc wajib diisi!" });
    }

    const domainUrl = domain.startsWith("http") ? domain : `https://${domain}`;
    
    // Ambil daftar server
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
      return res.json({ message: `Tidak ada panel di server ${index}` });
    }

    let messageText = `── List server panel pterodactyl server ${index} ──\n`;

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
      const status = resourceData.attributes?.current_state || s.status;

      const formatLimit = (val) => {
        if (val === 0) return "Unlimited";
        const gb = parseInt(val / 1000);
        return gb >= 1 ? `${gb}GB` : `${val}MB`;
      };

      messageText += `
ID       : ${s.id}
Nama     : ${s.name}
Ram      : ${formatLimit(s.limits.memory)}
CPU      : ${s.limits.cpu === 0 ? "Unlimited" : s.limits.cpu + "%"}
Disk     : ${formatLimit(s.limits.disk)}
Status   : ${status}
Created  : ${s.created_at.split("T")[0]}
`;
    }

    return res.json({ message: messageText.trim() });
  } catch (err) {
    return res.status(500).json({ error: "Terjadi kesalahan", detail: err.message });
  }
});

module.exports = router;