const express = require('express');
const axios = require('axios');

module.exports = function(app, validateApiKey) {

// CREATE SUBDOMAIN
app.get('/cf/subdomain/create', async (req, res) => {
  const { token, zone, domain, name, ipvps } = req.query;
  if (!token || !zone || !domain || !name || !ipvps) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
      {
        type: 'A',
        name: `${name}.${domain}`,
        content: ipvps,
        ttl: 1,
        proxied: false
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIST SUBDOMAINS
app.get('/cf/subdomain/list', async (req, res) => {
  const { token, zone } = req.query;
  if (!token || !zone) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE SUBDOMAIN
app.get('/cf/subdomain/delete', async (req, res) => {
  const { token, zone, id } = req.query;
  if (!token || !zone || !id) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    const response = await axios.delete(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint untuk menghapus SEMUA subdomain dari sebuah Zone.
 * Metode: GET (SANGAT TIDAK DISARANKAN DAN BERBAHAYA)
 * Query Params: ?zone=...&token=...
 */
app.get('/cf/subdomain/deleteall', async (req, res) => {
  // 1. Ambil semua data dari parameter query dengan nama baru
  const { zone, token } = req.query;

  // 2. Validasi input dengan nama parameter baru
  if (!zone) {
    return res.status(400).json({ success: false, error: "Parameter query 'zone' wajib diisi." });
  }
  if (!token) {
    return res.status(401).json({ success: false, error: "Parameter query 'token' yang berisi API Token Cloudflare wajib diisi." });
  }

  console.log(`[INFO] [METODE GET] Memulai proses penghapusan subdomain untuk Zone ID: ${zone}`);

  try {
    // Siapkan header untuk otentikasi menggunakan token dari parameter
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // --- Langkah 1: Dapatkan semua DNS records ---
    const listRecordsUrl = `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`;
    const listResponse = await axios.get(listRecordsUrl, { headers });

    const allRecords = listResponse.data.result;
    if (allRecords.length === 0) {
      return res.status(200).json({ success: true, message: "Tidak ada DNS record yang ditemukan di zone ini." });
    }

    const rootDomainName = allRecords[0].zone_name;
    console.log(`[INFO] Nama domain utama terdeteksi: ${rootDomainName}`);

    // --- Langkah 2: Filter untuk mendapatkan hanya subdomain ---
    const subdomainsToDelete = allRecords.filter(record => record.name !== rootDomainName);

    if (subdomainsToDelete.length === 0) {
      return res.status(200).json({ success: true, message: "Tidak ada subdomain yang ditemukan untuk dihapus." });
    }

    console.log(`[INFO] Ditemukan ${subdomainsToDelete.length} subdomain untuk dihapus.`);

    // --- Langkah 3: Hapus setiap subdomain ---
    const deletePromises = subdomainsToDelete.map(record => {
      const deleteUrl = `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${record.id}`;
      console.log(`[PROCESS] Menghapus: ${record.name} (ID: ${record.id})`);
      return axios.delete(deleteUrl, { headers });
    });

    const results = await Promise.allSettled(deletePromises);

    const deleted = [];
    const failed = [];

    results.forEach((result, index) => {
      const recordName = subdomainsToDelete[index].name;
      if (result.status === 'fulfilled') {
        deleted.push(recordName);
      } else {
        failed.push({
          name: recordName,
          reason: result.reason.response ? result.reason.response.data : result.reason.message
        });
      }
    });

    console.log(`[SUCCESS] Proses selesai. Berhasil dihapus: ${deleted.length}, Gagal: ${failed.length}`);

    // --- Langkah 4: Kirim respons akhir ---
    res.status(200).json({
      success: true,
      message: `Proses penghapusan selesai.`,
      deleted_count: deleted.length,
      failed_count: failed.length,
      deleted_subdomains: deleted,
      failed_subdomains: failed
    });

  } catch (error) {
    console.error("[FATAL ERROR] Gagal menghubungi atau memproses API Cloudflare:", error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      error: "Gagal memproses permintaan ke Cloudflare.",
      details: error.response ? error.response.data.errors : error.message
    });
  }
});
}