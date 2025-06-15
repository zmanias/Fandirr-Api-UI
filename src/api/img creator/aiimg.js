const express = require('express')
const axios = require('axios')

module.exports = function(app) {

const styleList = [
  'default',
  'ghibli',
  'cyberpunk',
  'anime',
  'portrait',
  'chibi',
  'pixel art',
  'oil painting',
  '3d'
]

const stylePrompt = {
  default: '-style Realism',
  ghibli: '-style Ghibli Art',
  cyberpunk: '-style Cyberpunk',
  anime: '-style Anime',
  portrait: '-style Portrait',
  chibi: '-style Chibi',
  'pixel art': '-style Pixel Art',
  'oil painting': '-style Oil Painting',
  '3d': '-style 3D'
}

const sizeList = {
  '1:1': '1024x1024',
  '3:2': '1080x720',
  '2:3': '720x1080'
}

// Endpoint: /api/deepimg?prompt=Gambar kucing&model=2&size=3:2
app.get('/imgcreator/aiimg', async (req, res) => {
  const prompt = req.query.prompt
  const model = parseInt(req.query.model) || 0
  const size = req.query.size || '3:2'

  if (!prompt) {
    return res.status(400).json({ error: 'Parameter prompt wajib diisi.' })
  }

  if (model < 0 || model >= styleList.length) {
    return res.status(400).json({ error: `Model tidak valid. Pilih angka 0-${styleList.length - 1}` })
  }

  if (!sizeList[size]) {
    return res.status(400).json({ error: `Size tidak valid. Pilihan: ${Object.keys(sizeList).join(', ')}` })
  }

  const headers = {
    'content-type': 'application/json',
    origin: 'https://deepimg.ai',
    referer: 'https://deepimg.ai/'
  }

  const device_id = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')

  const styleKey = styleList[model]
  const fullPrompt = `${prompt} ${stylePrompt[styleKey]}`

  const payload = {
    device_id,
    prompt: fullPrompt,
    size: sizeList[size],
    n: '1',
    output_format: 'png'
  }

  try {
    const result = await axios.post(
      'https://api-preview.apirouter.ai/api/v1/deepimg/flux-1-dev',
      payload,
      { headers }
    )

    const imageUrl = result.data?.data?.images?.[0]?.url

    if (!imageUrl) {
      return res.status(500).json({ error: 'Gagal mendapatkan URL gambar.' })
    }

    res.json({
      status: 'success',
      model: styleKey,
      size: sizeList[size],
      url: imageUrl
    })
  } catch (error) {
    const detail = error.response?.data || error.message
    res.status(500).json({ error: detail })
  }
})

app.listen(port, () => {
  console.log(`✅ Server DeepImg berjalan di http://localhost:${port}`)
})