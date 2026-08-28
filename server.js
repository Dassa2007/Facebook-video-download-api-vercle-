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
        let videoData = null;

        // Try multiple robust public endpoints to fetch Facebook video data safely
        try {
            const res1 = await axios.get(`https://tikwm.com/api/other/fdown?url=${encodeURIComponent(targetUrl)}`, { timeout: 8000 });
            if (res1.data && res1.data.code === 0 && res1.data.data) {
                videoData = res1.data.data;
            }
        } catch (e) {}

        if (!videoData) {
            try {
                const res2 = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(targetUrl)}`, { timeout: 8000 });
                if (res2.data && res2.data.status && res2.data.data) {
                    videoData = res2.data.data;
                }
            } catch (e) {}
        }

        if (videoData) {
            const finalHd = videoData.hd || videoData.sd || videoData.video || '';
            const finalSd = videoData.sd || videoData.hd || videoData.video || '';
            
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
                error: "Could not fetch video. Make sure the link is a public Facebook video." 
            });
        }

    } catch (error) {
        console.error('Server Error:', error.message);
        return res.status(200).json({ 
            success: false, 
            error: "Failed to process this link. Please try another public link." 
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
app.listen(PORT, () => console.log(`Facebook Server running on port ${PORT}`));

module.exports = app;
