const express = require('express')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const FormData = require('form-data')

module.exports = function(app) {
app.use(express.urlencoded({ extended: true }))

// GET /api/removal?image_url=https://example.com/image.jpg
app.get('/imgcreator/rmbg', async (req, res) => {
  const imageUrl = req.query.image_url
  if (!imageUrl) {
    return res.status(400).json({ error: 'Parameter "image_url" wajib disediakan.' })
  }

  const tmpDir = './tmp'
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

  const filename = path.join(tmpDir, `${Date.now()}.jpg`)

  try {
    // Download gambar dari URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    fs.writeFileSync(filename, response.data)

    // Siapkan FormData
    const form = new FormData()
    form.append('image', fs.createReadStream(filename))

    // Kirim ke abella.icu
    const { data } = await axios.post('https://www.abella.icu/removal-bg', form, {
      headers: form.getHeaders()
    })

    // Hasil URL dari response
    const resultUrl = data?.data?.previewUrl
    if (!resultUrl) throw new Error('Gagal mendapatkan hasil dari abella.icu')

    // Kirim URL hasil ke klien
    res.json({
      status: 'success',
      result: resultUrl
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Terjadi kesalahan saat memproses gambar.' })
  } finally {
    // Hapus file sementara
    if (fs.existsSync(filename)) fs.unlinkSync(filename)
  }
})
}