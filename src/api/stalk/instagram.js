const express = require('express');
const axios = require('axios');

module.exports = function(app) {

app.get('/stalk/ig', async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username parameter is required.' });
  }

  const fandirrApiUrl = `https://api.fandirr.web.id/api/stalk/ig?username=${username}`;

  try {
    const response = await axios.get(fandirrApiUrl);
    const fandirrData = response.data;

    // Check if the Fandirr API returned a successful response and has the expected structure
    if (fandirrData.success && fandirrData.result) {
      const { name, username, profilePic, posts, followers, following, bio } = fandirrData.result;

      // Construct the desired response format
      const customResponse = {
        success: true,
        result: {
          name: name,
          username: username, // Fandirr API might return without '@', if so, you might want to prepend it here
          profilePic: profilePic,
          posts: posts,
          followers: followers,
          following: following,
          bio: bio
        }
      };
      res.json(customResponse);
    } else {
      // Handle cases where Fandirr API indicates an error or unexpected structure
      res.status(500).json({ success: false, message: 'Failed to retrieve data from Fandirr API or unexpected response format.' });
    }

  } catch (error) {
    console.error('Error fetching data from Fandirr API:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error while fetching Instagram data.' });
  }
});
}