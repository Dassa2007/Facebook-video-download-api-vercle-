const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/download/facebook', async (req, res) => {
    let { url } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, error: 'Please provide a valid Facebook URL.' });
    }

    try {
        // Adding timeout to prevent hanging and server crashes
        const apiResponse = await axios.get(`https://tikwm.com/api/other/fdown?url=${encodeURIComponent(url)}`, {
            timeout: 8000
        });
        
        if (apiResponse.data && apiResponse.data.code === 0 && apiResponse.data.data) {
            const vData = apiResponse.data.data;
            return res.status(200).json({
                success: true,
                data: {
                    title: vData.title || 'Facebook Video',
                    cover: vData.thumbnail || '',
                    videoHD: vData.hd || vData.sd || '',
                    videoSD: vData.sd || vData.hd || ''
                }
            });
        }

        const altResponse = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`, {
            timeout: 8000
        });
        
        if (altResponse.data && altResponse.data.status && altResponse.data.data) {
            const videoData = altResponse.data.data;
            return res.status(200).json({
                success: true,
                data: {
                    title: videoData.title || 'Facebook Video',
                    cover: videoData.thumbnail || '',
                    videoHD: videoData.hd || videoData.sd || '',
                    videoSD: videoData.sd || videoData.hd || ''
                }
            });
        }

        return res.status(400).json({ 
            success: false, 
            error: 'Failed to fetch the video. Please check if the link is correct or public.' 
        });

    } catch (error) {
        console.error('API Error:', error.message);
        return res.status(200).json({ 
            success: false, 
            error: 'Could not process this video link. Try another public Facebook link.' 
        });
    }
});

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
            timeout: 15000,
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
