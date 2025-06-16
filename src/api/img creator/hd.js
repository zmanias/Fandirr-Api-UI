const express = require('express')
const fetch = require('node-fetch') // versi 2, wajib!
const FormData = require('form-data')

module.exports = function(app) {

app.get('/imgcreator/upscale', async (req, res) => {
  const imageUrl = req.query.image_url

  if (!imageUrl) {
    return res.status(400).json({ error: 'Parameter "image_url" wajib disediakan.' })
  }

  try {
    // Ambil gambar dari URL
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) throw new Error('Gagal mengunduh gambar.')

    const contentType = imageRes.headers.get('content-type')
    if (!/image\/(jpe?g|png)/i.test(contentType)) {
      return res.status(400).json({ error: 'Hanya format JPG dan PNG yang didukung.' })
    }

    const buffer = await imageRes.buffer()
    const ext = contentType.split('/')[1]
    const filename = `image.${ext}`

    const form = new FormData()
    form.append('image', buffer, { filename, contentType })
    form.append('scale', '2')

    const headers = {
      ...form.getHeaders(),
      'accept': 'application/json',
      'x-client-version': 'web',
      'x-locale': 'en'
    }

    const response = await fetch('https://api2.pixelcut.app/image/upscale/v1', {
      method: 'POST',
      headers,
      body: form
    })

    const json = await response.json()
    if (!json?.result_url || !json.result_url.startsWith('http')) {
      return res.status(500).json({ error: 'Gagal mendapatkan hasil dari Pixelcut.' })
    }

    const resultImage = await fetch(json.result_url)
    const resultBuffer = await resultImage.buffer()

    res.set('Content-Type', 'image/jpeg')
    res.send(resultBuffer)

  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: err.message || 'Terjadi kesalahan saat upscaling.' })
  }
})
}