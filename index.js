const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "API is running successfully!" });
});

// Facebook Downloader Endpoint
app.get('/api/download', async (req, res) => {
  let videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ success: false, error: 'Please provide a Facebook video URL using ?url=' });
  }

  try {
    // Handle Facebook share links if redirected
    if (videoUrl.includes('fb.share') || videoUrl.includes('/share/')) {
      const resp = await axios.get(videoUrl, {
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });
      videoUrl = resp.request.res.responseUrl || videoUrl;
    }

    // Using general scraper logic matching your working setup
    const response = await axios.get(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract video metadata and links
    let hdLink = $('meta[property="og:video:secure_url"]').attr('content') || 
                 $('meta[property="og:video"]').attr('content');
    let title = $('meta[property="og:title"]').attr('content') || 'Facebook Video';
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';

    if (!hdLink) {
      return res.status(404).json({ success: false, error: 'Could not find video links. Make sure the post is public.' });
    }

    res.json({
      success: true,
      title: title,
      thumbnail: thumbnail,
      sd: hdLink,
      hd: hdLink
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch video. Please check the URL.' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
