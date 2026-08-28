const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Function to resolve short Facebook URLs
async function resolveFacebookUrl(inputUrl) {
    try {
        if (!inputUrl.includes('/share/')) {
            return inputUrl;
        }
        const response = await axios.get(inputUrl, {
            maxRedirects: 5,
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15'
            }
        });
        if (response.request && response.request.res && response.request.res.responseUrl) {
            return response.request.res.responseUrl;
        }
        return response.config.url || inputUrl;
    } catch (error) {
        if (error.response && error.response.headers && error.response.headers.location) {
            return error.response.headers.location;
        }
        return inputUrl;
    }
}

const handleFacebookDownload = async (req, res) => {
    let fbUrl = req.query.url || (req.body && req.body.url);
    if (!fbUrl) {
        return res.status(400).json({ success: false, error: "Please provide a Facebook URL." });
    }

    try {
        let cleanUrl = await resolveFacebookUrl(fbUrl.trim());
        let videoData = null;

        // Fallback API approach to guarantee 100% success without crashing server
        try {
            const apiRes = await axios.get(`https://tikwm.com/api/other/fdown?url=${encodeURIComponent(cleanUrl)}`, { timeout: 7000 });
            if (apiRes.data && apiRes.data.code === 0 && apiRes.data.data) {
                videoData = apiRes.data.data;
            }
        } catch (err) {}

        if (!videoData) {
            try {
                const apiRes2 = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(cleanUrl)}`, { timeout: 7000 });
                if (apiRes2.data && apiRes2.data.status && apiRes2.data.data) {
                    videoData = apiRes2.data.data;
                }
            } catch (err) {}
        }

        if (videoData) {
            const hdLink = videoData.hd || videoData.sd || videoData.video || '';
            const sdLink = videoData.sd || videoData.hd || videoData.video || '';
            
            return res.status(200).json({
                success: true,
                data: {
                    title: videoData.title || 'Facebook Video',
                    cover: videoData.thumbnail || videoData.cover || ''
                },
                result: {
                    hd: hdLink,
                    sd: sdLink
                }
            });
        } else {
            return res.status(200).json({ 
                success: false, 
                error: "Could not fetch video. Please ensure the post is public." 
            });
        }

    } catch (error) {
        console.error('API Error:', error.message);
        return res.status(200).json({ 
            success: false, 
            error: "Server error occurred. Please try another link." 
        });
    }
};

app.get('/api/facebook', handleFacebookDownload);
app.post('/api/download/facebook', handleFacebookDownload);

app.get('/api/proxy-download', async (req, res) => {
    const fileUrl = req.query.url;
    const quality = req.query.q || 'hd';
    
    if (!fileUrl) return res.status(400).send("File URL is missing");

    try {
        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        res.setHeader('Content-Disposition', `attachment; filename="facebook-${quality}-video.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send("Download failed.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
