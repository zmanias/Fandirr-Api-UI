// Mengimpor library yang dibutuhkan
const express = require('express');
const axios = require('axios');

module.exports = function(app) {
// --- Objek Logika untuk Generator Gambar ---
const imagen = {
  // Konfigurasi dasar untuk API
  api: {
    base: 'https://image.pollinations.ai',
    endpoints: {
      textToImage: (prompt, width, height, seed) =>
        `/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&safe=true&seed=${seed}`
    }
  },

  // Headers yang akan dikirimkan bersama setiap permintaan ke API
  headers: {
    'user-agent': 'NB Android/1.0.0',
    'accept': 'image/jpeg',
    'Authorization': 'Bearer Vxbsp6f84MqPzLgK',
    'referer': 'https://image.pollinations.ai/'
  },

  /**
   * Fungsi untuk mempersiapkan prompt dan parameter lainnya sebelum dikirim ke API.
   * @param {string} prompt - Teks deskripsi gambar yang diinginkan.
   * @param {string} type - Gaya seni yang akan diterapkan.
   * @param {string} negative - Hal-hal yang tidak ingin ada di dalam gambar.
   * @param {string} size - Rasio aspek gambar (misal: '1:1', '16:9').
   * @returns {object} - Objek yang berisi prompt yang sudah dimodifikasi, prompt negatif, dan dimensi gambar.
   */
  request: (prompt, type, negative, size) => {
    const stylePrompts = {
      'No Style': '{prompt}',
      'Realistic': 'realistic photo {prompt}. highly detailed, high budget, highly details, epic, high quality',
      'Ghibli': 'style of studio ghibli, Hayao Miyazaki style',
      'GTA': 'GTA style {prompt}. Realistic gta art style, rockstar games artwork, vice city, photorealistic concept art, detailed face, realistic anatomy, epic, cinematic, high detail, highly detailed, 4k RAW',
      'Anime': 'anime style {prompt}. key visual, vibrant, studio anime, highly detailed',
      'Cinematic': 'cinematic still {prompt}. emotional, harmonious, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy',
      'Photographic': 'cinematic photo {prompt}. 35mm photograph, film, bokeh, professional, 4k, highly detailed',
      'Fantasy': 'ethereal fantasy concept art of {prompt}. magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy',
      'Cartoon': 'cartoon style {prompt}. cartoon, vibrant, high-energy, detailed',
      'Cyberpunk': 'cyberpunk style {prompt}. extremely detailed, photorealistic, 8k, realistic, neon ambiance, vibrant, high-energy, cyber, futuristic',
      'Manga': 'manga style {prompt}. vibrant, high-energy, detailed, iconic, Japanese comic style',
      'Digital Art': 'concept art {prompt}. digital artwork, illustrative, painterly, matte painting, highly detailed',
      'Colorful': 'colorful style {prompt}. color, vibrant, high-energy, detailed, cover art, dreamy',
      'Robot': 'robotic style {prompt}. robotic, vibrant, high-energy, detailed, cyber, futuristic',
      'Neonpunk': 'neonpunk style {prompt}. cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional',
      'Pixel Art': 'pixel-art style {prompt}. low-res, blocky, 8-bit graphics, 16-bit, pixel',
      'Disney': 'disney style {prompt}. disney cartoon, vibrant, high-energy, detailed, 3d, disney styles',
      '3D Model': 'professional 3d model {prompt}. octane render, highly detailed, volumetric, dramatic lighting',
    };
    const negativePrompts = {
      'No Style': 'extra hand, extra legs, ugly, glitch, bad eyes, low quality face, text, glitch, deformed, mutated, ugly, disfigured',
      'Realistic': 'anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured',
      'Ghibli': '-',
      'GTA': 'ugly, deformed, noisy, blurry, anime, cartoon, distorted, out of focus, bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, missing fingers',
      'Anime': 'photo, deformed, black and white, realism, disfigured, low contrast',
      'Cinematic': 'anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured',
      'Photographic': 'drawing, painting, crayon, sketch, graphite, impressionist, noisy, blurry, soft, deformed, ugly',
      'Fantasy': 'photographic, realis, realism, 35mm film, dslr, cropped, frame, text, deformed, glitch, noise, noisy, off-center, deformed, cross-eyed, closed eyes, bad anatomy, ugly, disfigured, sloppy, duplicate, mutated, black and white',
      'Cartoon': 'ugly, deformed, noisy, blurry, low contrast, realism, photorealistic',
      'Cyberpunk': 'anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured',
      'Manga': 'ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, Western comic style',
      'Digital Art': 'photo, photorealistic, realism, ugly',
      'Colorful': 'graphic, text, painting, crayon, graphite, glitch, deformed, mutated, ugly, disfigured',
      'Robot': 'anime, cartoon, text, painting, crayon, graphite, glitch, deformed, mutated, ugly, disfigured',
      'Neonpunk': 'painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured',
      'Pixel Art': 'sloppy, messy, blurry, noisy, highly detailed, ultra textured, photo, realistic',
      'Disney': 'graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured',
      '3D Model': 'ugly, deformed, noisy, low poly, blurry, painting',
    };
    const extraPrompt = (stylePrompts[type] || '{prompt}').replace('{prompt}', prompt);
    const fullNegative = `${negative}, ${negativePrompts[type] || ''}, nude, nudity, naked, sfw, nsfw, sex, erotic, pornography, hentai, explicit, fetish, bdsm, orgy, masturbate, masturbation, genital, vagina, penis, nipples, nipple, intercourse, ejaculation, orgasm, cunt, boobs, ****, tits, breast, ass, topless, fisting, censored`;
    let dimensions;
    switch (size) {
      case '3:4': dimensions = [864, 1152]; break;
      case '4:3': dimensions = [1152, 864]; break;
      case '16:9': dimensions = [1366, 768]; break;
      case '9:16': dimensions = [768, 1366]; break;
      default: dimensions = [1024, 1024];
    }
    return { extraPrompt, negative: fullNegative, dimensions };
  },

  /**
   * Fungsi utama untuk menghasilkan gambar.
   * @param {string} prompt - Teks deskripsi gambar.
   * @param {string} type - Gaya seni. Default: 'No Style'.
   * @param {string} negative - Prompt negatif. Default: ''.
   * @param {string} size - Rasio aspek. Default: '1:1'.
   * @returns {Promise<object>} - Objek hasil yang berisi status dan data gambar atau error.
   */
  generate: async (prompt = '', type = 'No Style', negative = '', size = '1:1') => {
    if (!prompt?.trim()) {
      return { success: false, code: 400, result: { error: 'Promptnya mana njirr 🗿 Malah kosong begini... ' } };
    }
    try {
      const { extraPrompt, negative: fullNegative, dimensions } = imagen.request(prompt, type, negative, size);
      const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      const url = `${imagen.api.base}${imagen.api.endpoints.textToImage(`${extraPrompt}, ${prompt}`, dimensions[0], dimensions[1], seed)}`;
      
      const response = await axios.get(url, {
        headers: imagen.headers,
        timeout: 60000,
        responseType: 'arraybuffer'
      });

      if (!response.data || response.data.length === 0) {
        return { success: false, code: 404, result: { error: 'Kagak ada responsenya bree 🫵🏻🤣' } };
      }
      
      // Mengembalikan buffer gambar beserta detailnya
      return {
        success: true,
        code: 200,
        result: {
          image_buffer: response.data,
          content_type: response.headers['content-type'],
          prompt,
          type,
          negative: fullNegative,
          dimensions,
          url_request: url,
          created: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, code: error?.response?.status || 500, result: { error: 'Error bree 😂' } };
    }
  }
};

// Membuat endpoint/route untuk generate gambar
// Contoh URL: http://localhost:3000/generate-image?prompt=a%20blue%20cat&type=Cartoon&size=1:1
app.get('/ai/imagen', async (req, res) => {
  // Ambil parameter dari query URL
  const {
    prompt,
    type = 'No Style', // Beri nilai default
    negative = '',
    size = '1:1'
  } = req.query;

  // Panggil fungsi generate dari objek imagen yang ada di file ini
  const response = await imagen.generate(prompt, type, negative, size);

  if (response.success) {
    // Jika berhasil, kirim gambar langsung sebagai respons
    res.set('Content-Type', response.result.content_type);
    res.send(response.result.image_buffer);
  } else {
    // Jika gagal, kirim pesan error dalam format JSON
    res.status(response.code).json(response.result);
  }
});
}