import express from 'express';
import axios from 'axios';


app.use(express.json());

const styleList = [
  'default', 'ghibli', 'cyberpunk', 'anime',
  'portrait', 'chibi', 'pixel art', 'oil painting', '3d'
];

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
};

const sizeList = {
  '1:1': '1024x1024',
  '3:2': '1080x720',
  '2:3': '720x1080'
};

// Endpoint: POST /generate
app.post('/generate', async (req, res) => {
  // Ambil dari query string dulu, jika tidak ada baru dari body
  const prompt = req.query.prompt || req.body.prompt;
  const style = (req.query.style || req.body.style || '').toLowerCase();
  const size = req.query.size || req.body.size;

  // Validasi
  if (!prompt || !style || !size) {
    return res.status(400).json({
      error: 'Field prompt, style, dan size wajib diisi.',
      example: {
        prompt: 'kucing lucu di luar angkasa',
        style: 'anime',
        size: '1:1'
      }
    });
  }

  if (!styleList.includes(style)) {
    return res.status(400).json({
      error: `Style '${style}' tidak dikenali.`,
      availableStyles: styleList
    });
  }

  if (!sizeList[size]) {
    return res.status(400).json({
      error: `Ukuran '${size}' tidak tersedia.`,
      availableSizes: Object.keys(sizeList)
    });
  }

  const headers = {
    'content-type': 'application/json',
    origin: 'https://deepimg.ai',
    referer: 'https://deepimg.ai/'
  };

  const device_id = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const payload = {
    device_id,
    prompt: `${prompt} ${stylePrompt[style]}`,
    size: sizeList[size],
    n: '1',
    output_format: 'png'
  };

  try {
    const response = await axios.post(
      'https://api-preview.apirouter.ai/api/v1/deepimg/flux-1-dev',
      payload,
      { headers }
    );

    const imageUrl = response.data?.data?.images?.[0]?.url;

    if (!imageUrl) throw new Error('Gagal mendapatkan gambar.');

    return res.json({
      message: 'Berhasil membuat gambar.',
      data: {
        prompt,
        style,
        size,
        imageUrl
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Gagal memproses permintaan.',
      details: error?.response?.data || error.message
    });
  }
});
