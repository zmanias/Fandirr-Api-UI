const express = require('express')
const axios = require('axios')
const FormData = require('form-data')
const stream = require('stream')

module.exports = function(app) {

// Endpoint: /api/removal?image_url=https://example.com/image.jpg
app.get('/imgcreator/rmbg', async (req, res) => {
  const imageUrl = req.query.image_url
  if (!imageUrl) {
    return res.status(400).json({ error: 'Parameter "image_url" wajib disediakan.' })
  }

  try {
    // Unduh gambar langsung sebagai buffer
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(response.data)

    // Siapkan readable stream dari buffer (tanpa file)
    const bufferStream = new stream.PassThrough()
    bufferStream.end(imageBuffer)

    // Kirim ke API abella.icu
    const form = new FormData()
    form.append('image', bufferStream, {
      filename: 'image.jpg',
      contentType: response.headers['content-type']
    })

    const { data } = await axios.post('https://www.abella.icu/removal-bg', form, {
      headers: form.getHeaders()
    })

    const previewUrl = data?.data?.previewUrl
    if (!previewUrl) {
      throw new Error('Gagal mendapatkan hasil dari abella.icu')
    }

    res.json({
      status: 'success',
      result: previewUrl
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Ups! Gagal memproses gambar.' })
  }
})
}