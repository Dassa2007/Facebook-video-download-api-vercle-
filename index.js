const express = require('express');
const cors = require('cors');
const { getFBInfo } = require('fb-downloader-scrapper');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Facebook Video Downloader API is running on Vercel!');
});

app.get('/api/download', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: 'Please provide a Facebook video URL using ?url=' });
  }

  try {
    const result = await getFBInfo(videoUrl);
    res.json({
      success: true,
      title: result.title || 'Facebook Video',
      thumbnail: result.thumbnail,
      sd: result.sd,
      hd: result.hd || result.sd
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch video. Make sure the URL is public.' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
