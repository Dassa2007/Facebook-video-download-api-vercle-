const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Facebook වීඩියෝ දත්ත ලබා ගන්න API එක
app.post('/api/download/facebook', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'කරුණාකර Facebook URL එකක් ලබා දෙන්න.' });
    }

    try {
        // ෆේස්බුක් ලින්ක් සඳහා ක්‍රියාත්මක වන නිදහස් API එකක් භාවිතය
        const options = {
            method: 'GET',
            url: 'https://tikwm.com/api/other/fdown', // හෝ ෆේස්බුක් සඳහා සුදුසු එපොයින්ට් එකක්
            params: { url: url }
        };

        // විකල්පයක් ලෙස RapidAPI හෝ වෙනත් නිදහස් FBDOWN සේවා API එකක් මෙහිදී සම්බන්ධ කළ හැක.
        // පහත දැක්වෙන්නේ පොදු ක්‍රමවේදයයි:
        const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (data && (data.status || data.data)) {
            const videoData = data.data || data;
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
            return res.status(400).json({ success: false, error: 'වීඩියෝව ලබා ගැනීමට නොහැකි විය. ලින්ක් එක නිවැරදි දැයි පරීක්ෂා කරන්න.' });
        }
    } catch (error) {
        // වෙනත් විකල්ප ෆේස්බුක් API එකකට මාරුවීම සඳහා ෆෝල්බැක් එකක්
        try {
            const altResponse = await axios.get(`https://getmyfb.com/api/json`, { params: { url: url } });
            // අවශ්‍ය නම් මෙහි වෙනත් ස්ට්‍රක්චර් එකක් හැසිරවිය හැක
        } catch (err) {}
        
        res.status(500).json({ success: false, error: 'සර්වර් දෝෂයක් සිදු විය.' });
    }
});

// 2. Facebook වීඩියෝව කෙලින්ම ඩවුන්ලෝඩ් කරවන Proxy API එක
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
