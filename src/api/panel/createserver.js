const express = require('express')
const fetch = require('node-fetch');
const crypto = require('crypto');

module.exports = function(app, validateApiKey) {

// Fungsi bantu
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const tanggal = (timestamp) => new Date(timestamp).toISOString().split("T")[0];

// Spesifikasi berdasarkan plan
const planSpecs = {
  "1gb": { ram: "1000", disk: "1000", cpu: "40" },
  "2gb": { ram: "2000", disk: "1000", cpu: "60" },
  "3gb": { ram: "3000", disk: "2000", cpu: "80" },
  "4gb": { ram: "4000", disk: "2000", cpu: "100" },
  "5gb": { ram: "5000", disk: "3000", cpu: "120" },
  "6gb": { ram: "6000", disk: "3000", cpu: "140" },
  "7gb": { ram: "7000", disk: "4000", cpu: "160" },
  "8gb": { ram: "8000", disk: "4000", cpu: "180" },
  "9gb": { ram: "9000", disk: "5000", cpu: "200" },
  "10gb": { ram: "10000", disk: "5000", cpu: "220" },
  "unli": { ram: "0", disk: "0", cpu: "0" },
  "unlimited": { ram: "0", disk: "0", cpu: "0" }
};

app.get('/panel/create-server', async (req, res) => {
  const { plan, domain, plta, egg, nestid, loc, username } = req.query;

  // Validasi
  if (!plan || !domain || !plta || !egg || !nestid || !loc || !username) {
    return res.status(400).json({ error: "❌ Parameter tidak lengkap. Gunakan: plan, domain, plta, egg, nestid, loc, username" });
  }

  const specs = planSpecs[plan.toLowerCase()];
  if (!specs) return res.status(400).json({ error: "❌ Plan tidak valid." });

  const email = `${username}@gmail.com`;
  const name = `${capital(username)} Server`;
  const password = username + crypto.randomBytes(2).toString('hex');

  try {
    // Buat user
    const createUser = await fetch(`${domain}/api/application/users`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${plta}`
      },
      body: JSON.stringify({
        email,
        username,
        first_name: name,
        last_name: "Server",
        language: "en",
        password
      })
    });

    const userData = await createUser.json();
    if (userData.errors) return res.status(500).json(userData.errors[0]);

    const userId = userData.attributes.id;

    // Get startup command
    const eggInfo = await fetch(`${domain}/api/application/nests/${nestid}/eggs/${egg}`, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${plta}`
      }
    });
    const eggData = await eggInfo.json();
    const startup = eggData.attributes.startup;

    // Create server
    const createServer = await fetch(`${domain}/api/application/servers`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${plta}`
      },
      body: JSON.stringify({
        name,
        description: tanggal(Date.now()),
        user: userId,
        egg: parseInt(egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start"
        },
        limits: {
          memory: specs.ram,
          swap: 0,
          disk: specs.disk,
          io: 500,
          cpu: specs.cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 5
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });

    const serverData = await createServer.json();
    if (serverData.errors) return res.status(500).json(serverData.errors[0]);

    const responseText = `*DATA AKUN PANEL KAMU 📦*

📡 ID Server: ${serverData.attributes.id}
🌐 Login: ${domain}
👤 Username: ${username}
🔐 Password: ${password}
🗓️ Created: ${userData.attributes.created_at.split("T")[0]}

🌐 Spesifikasi:
- RAM : ${specs.ram === "0" ? "Unlimited" : specs.ram + " MB"}
- Disk: ${specs.disk === "0" ? "Unlimited" : specs.disk + " MB"}
- CPU : ${specs.cpu === "0" ? "Unlimited" : specs.cpu + "%"}

📌 Syarat & Ketentuan:
- Masa aktif 1 bulan
- Garansi 15 hari (1x replace)
- Simpan data ini baik-baik`;

    return res.json({
      status: "success",
      data: {
        id: serverData.attributes.id,
        domain,
        username,
        password,
        plan,
        created: userData.attributes.created_at,
        specs,
        info: responseText
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "❌ Terjadi kesalahan saat membuat server." });
  }
});
}