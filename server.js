const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Helper function to resolve shortened/share URLs
async function expandUrl(url) {
    try {
        if (url.includes('fb.share') || url.includes('/share/')) {
            const response = await axios.get(url, {
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            return response.request.res.responseUrl || url;
        }
    } catch (error) {
        // If expansion fails, return the original URL
    }
    return url;
}

// 1. Facebook video downloader API endpoint
app.post('/api/download/facebook', async (req, res) => {
    let { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Please provide a valid Facebook URL.' });
    }

    try {
        // Expand the URL if it's a short share link
        url = await expandUrl(url);

        const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (data && data.status && data.data) {
            const videoData = data.data;
            return res.status(200).json({
                success: true,
                data: {
                    title: videoData.title || 'Facebook Video',
                    cover: videoData.thumbnail || '',
                    videoHD: videoData.hd || videoData.sd || '',
                    videoSD: videoData.sd || videoData.hd || ''
                }
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Failed to fetch the video. Please check if the link is correct or public.' 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: 'Server error occurred. Please try again later.' 
        });
    }
});

// 2. Fast direct download proxy endpoint
app.get('/api/proxy-download', async (req, res) => {
    const fileUrl = req.query.url;
    const quality = req.query.q || 'hd';
    
    if (!fileUrl) {
        return res.status(400).send('File URL is missing');
    }

    try {
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        res.setHeader('Content-Disposition', `attachment; filename="facebook-${quality}-video.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Download failed');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
