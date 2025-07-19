// Impor modul yang dibutuhkan
const express = require('express');
const { nikParser } = require('nik-parser');

module.exports = function(app) {
  
app.get('/tools/lacak-ktp', (req, res) => {
  // Ambil NIK dari parameter query di URL
  const { nik: nikQuery } = req.query;

  // 1. Validasi Input: Cek apakah parameter NIK ada
  if (!nikQuery) {
    return res.status(400).json({
      success: false,
      error: 'Parameter query "nik" wajib diisi.'
    });
  }

  try {
    // 2. Proses NIK menggunakan nik-parser
    const nik = nikParser(nikQuery);

    // 3. Validasi NIK: Cek apakah format NIK valid menurut library
    if (!nik.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Format NIK tidak valid.',
        nik: nikQuery
      });
    }

    // 4. Ekstrak semua data dari NIK
    const provinsi = nik.province();
    const kabupaten = nik.kabupatenKota();
    const kecamatan = nik.kecamatan();

    // Buat URL Google Maps untuk lokasi kecamatan
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${kecamatan}, ${kabupaten}, ${provinsi}`)}`;

    // 5. Siapkan respons dalam format JSON yang terstruktur
    const responseData = {
      nik: nikQuery,
      isValid: nik.isValid(),
      gender: nik.kelamin(),
      dateOfBirth: nik.lahir(),
      uniqueCode: nik.uniqcode(),
      province: {
        id: nik.provinceId(),
        name: provinsi
      },
      city: {
        id: nik.kabupatenKotaId(),
        name: kabupaten
      },
      district: {
        id: nik.kecamatanId(),
        name: kecamatan
      },
      postalCode: nik.kodepos(),
      mapsUrl: mapsUrl
    };

    // 6. Kirim respons sukses dengan data JSON
    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    // Tangani jika terjadi error tak terduga saat pemrosesan
    console.error("Error saat memproses NIK:", error.message);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan internal pada server.',
      details: error.message
    });
  }
});
}