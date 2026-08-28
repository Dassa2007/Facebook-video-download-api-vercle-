const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const handleFacebookDownload = async (req, res) => {
    let fbUrl = req.query.url || (req.body && req.body.url);
    if (!fbUrl) {
        return res.status(400).json({ success: false, error: "Please provide a Facebook URL." });
    }

    try {
        let targetUrl = fbUrl.trim();

        // If it's a short share link, we can use a reliable public API that handles Facebook short links automatically
        // Let's use a robust multi-fallback approach
        
        let videoData = null;

        // Method 1: Using TikWM / FDown alternative
        try {
            const res1 = await axios.get(`https://tikwm.com/api/other/fdown?url=${encodeURIComponent(targetUrl)}`, { timeout: 7000 });
            if (res1.data && res1.data.code === 0 && res1.data.data) {
                videoData = res1.data.data;
            }
        } catch (e) {
            // Ignore and move to next fallback
        }

        // Method 2: Using RyzenDesu FBDL
        if (!videoData) {
            try {
                const res2 = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(targetUrl)}`, { timeout: 7000 });
                if (res2.data && res2.data.status && res2.data.data) {
                    videoData = res2.data.data;
                }
            } catch (e) {
                // Ignore and move to next fallback
            }
        }

        // Method 3: Using another alternative public API endpoint
        if (!videoData) {
            try {
                const res3 = await axios.get(`https://deliriussapi-oficial.vercel.app/download/fbdl?url=${encodeURIComponent(targetUrl)}`, { timeout: 7000 });
                if (res3.data && res3.data.status && res3.data.data) {
                    videoData = res3.data.data;
                }
            } catch (e) {
                // Ignore
            }
        }

        if (videoData) {
            return res.status(200).json({
                success: true,
                data: {
                    title: videoData.title || 'Facebook Video',
                    cover: videoData.thumbnail || videoData.cover || '',
                    videoHD: videoData.hd || videoData.sd || videoData.video || '',
                    videoSD: videoData.sd || videoData.hd || videoData.video || ''
                },
                result: {
                    hd: videoData.hd || videoData.sd || videoData.video || '',
                    sd: videoData.sd || videoData.hd || videoData.video || ''
                }
            });
        } else {
            return.status(200).json({ 
                success: false, 
                error: "Could not fetch video. Please make sure the link is a public Facebook video." 
            });
        }

    } catch (error) {
        console.error('Server Error:', error.message);
        return.status(200).json({ 
            success: false, 
            error: "Failed to process this link. Please try another public link." 
        });
    }
};

app.get('/api/facebook', handleFacebookDownload);
app.post('/api/download/facebook', handleFacebookDownload);

// Download Proxy to force direct file download without opening tabs
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
app.listen(PORT, () => console.log(`Facebook Server running on port ${PORT}`));

module.exports = app;
