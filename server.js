const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Function to resolve short Facebook URLs to actual video URLs
async function getRealFacebookUrl(shortUrl) {
    try {
        if (!shortUrl.includes('/share/')) {
            return shortUrl;
        }
        const response = await axios.get(shortUrl, {
            maxRedirects: 5,
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            }
        });
        if (response.request && response.request.res && response.request.res.responseUrl) {
            return response.request.res.responseUrl;
        }
        return response.config.url || shortUrl;
    } catch (error) {
        if (error.response && error.response.headers && error.response.headers.location) {
            return error.response.headers.location;
        }
        return shortUrl;
    }
}

const handleFacebookDownload = async (req, res) => {
    let fbUrl = req.query.url || (req.body && req.body.url);
    if (!fbUrl) {
        return res.status(400).json({ success: false, error: "Please provide a Facebook URL." });
    }

    try {
        let cleanUrl = await getRealFacebookUrl(fbUrl.trim());
        let videoData = null;

        // Try API to fetch video data using the resolved clean URL
        try {
            const apiRes = await axios.get(`https://tikwm.com/api/other/fdown?url=${encodeURIComponent(cleanUrl)}`, { timeout: 7000 });
            if (apiRes.data && apiRes.data.code === 0 && apiRes.data.data) {
                videoData = apiRes.data.data;
            }
        } catch (e) {}

        if (!videoData) {
            try {
                const apiRes2 = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(cleanUrl)}`, { timeout: 7000 });
                if (apiRes2.data && apiRes2.data.status && apiRes2.data.data) {
                    videoData = apiRes2.data.data;
                }
            } catch (e) {}
        }

        if (videoData) {
            const finalHd = videoData.hd || videoData.url || videoData.video || videoData.sd || '';
            const finalSd = videoData.sd || videoData.hd || videoData.url || videoData.video || '';
            
            return res.status(200).json({
                success: true,
                data: {
                    title: videoData.title || 'Facebook Video',
                    cover: videoData.thumbnail || videoData.cover || ''
                },
                result: {
                    hd: finalHd,
                    sd: finalSd
                }
            });
        } else {
            return res.status(200).json({
                success: false,
                error: "Could not extract video. Make sure the post is public."
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Server processing error."
        });
    }
};

app.get('/api/facebook', handleFacebookDownload);
app.post('/api/download/facebook', handleFacebookDownload);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
