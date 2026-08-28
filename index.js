const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "Vercel FB Downloader API is running!" });
});

app.get('/api/download', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ success: false, error: 'Please provide a video URL using ?url=' });
  }

  try {
    // Using a reliable public API wrapper endpoint or direct fetch logic optimized for Vercel
    const apiUrl = `https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(videoUrl)}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    if (response.data && (response.data.data || response.data.url)) {
      const data = response.data.data || response.data;
      
      // หา links (HD / SD)
      let hdLink = data.hd || data.url || data[0]?.url;
      let sdLink = data.sd || data.url || data[1]?.url;
      let title = data.title || "Facebook Video";
      let thumbnail = data.thumbnail || "";

      return res.json({
        success: true,
        title: title,
        thumbnail: thumbnail,
        sd: sdLink || hdLink,
        hd: hdLink || sdLink
      });
    } else {
      // Fallback method if primary api wrapper fails
      return res.status(500).json({ success: false, error: 'Could not fetch video links. Try another link.' });
    }

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process request on Vercel server.' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
