const express = require('express');
const axios = require('axios');

module.exports = function(app, validateApiKey) {
  async function generateStory(question) {
    let { data } = await axios.get(
      'https://aistorygenerator.co/index.php?wpaicg_stream=yes&' +
      new URLSearchParams({
        question,
        model_provider: 'OpenAI',
        engine: 'gpt-4o-mini',
        max_tokens: 2600,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stop: '',
        post_title: 'AI Story Generator',
        id: 492,
        source_stream: 'form',
        nonce: 'edb9335bee'
      }),
      {
        headers: { referer: 'https://aistorygenerator.co/' },
        responseType: 'stream'
      }
    );

    let story = '';
    for await (const chunk of data) {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const clean = line.replace('data: ', '').trim();
          if (clean && clean !== '[DONE]') {
            try {
              const content = JSON.parse(clean).choices?.[0]?.delta?.content;
              if (content) story += content;
            } catch {}
          }
        }
      }
    }
    return story;
  }

  // ✅ Endpoint GET
  app.get('/ai/aistory', async (req, res) => {
    const question = req.query.question;

    if (!question) {
      return res.status(400).json({ error: 'Parameter "question" diperlukan.' });
    }

    try {
      const story = await generateStory(question);
      res.json({ question, story });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}