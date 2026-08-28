const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Function to automatically resolve /share/ links and get the real Facebook video URL
async function resolveFacebookUrl(inputUrl) {
    try {
        if (!inputUrl.includes('/share/')) {
            return inputUrl;
        }

        const response = await axios.get(inputUrl, {
            maxRedirects: 10,
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
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
        // Step 1: Expand short share link to real Facebook URL
        let expandedUrl = await resolveFacebookUrl(fbUrl.trim());

        // Step 2: Fetch Facebook page HTML using mobile user-agent
        const response = await axios.get(expandedUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let hdVideo = null;
        let sdVideo = null;

        // Extracting HD and SD video sources from Facebook mobile meta/scripts
        const hdMatch = html.match(/"browser_native_hd_url":"([^"]+)"/) || html.match(/hd_src:"([^"]+)"/);
        const sdMatch = html.match(/"browser_native_sd_url":"([^"]+)"/) || html.match(/sd_src:"([^"]+)"/);

        if (hdMatch && hdMatch[1]) {
            hdVideo = hdMatch[1].replace(/\\u002F/g, '/').replace(/\\&/g, '&');
        }
        if (sdMatch && sdMatch[1]) {
            sdVideo = sdMatch[1].replace(/\\u002F/g, '/').replace(/\\&/g, '&');
        }

        // Fallback to OpenGraph video if regex fails
        if (!hdVideo && !sdVideo) {
            let ogVideo = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:secure_url"]').attr('content');
            if (ogVideo) {
                sdVideo = ogVideo;
            }
        }

        if (hdVideo || sdVideo) {
            return res.status(200).json({
                success: true,
                data: {
                    title: $('meta[property="og:title"]').attr('content') || 'Facebook Video',
                    cover: $('meta[property="og:image"]').attr('content') || '',
                    videoHD: hdVideo || sdVideo,
                    videoSD: sdVideo || hdVideo
                },
                result: {
                    hd: hdVideo || sdVideo,
                    sd: sdVideo || hdVideo
                }
            });
        } else {
            return res.status(200).json({ 
                success: false, 
                error: "Could not fetch video. Please make sure the link is a public Facebook video." 
            });
        }

    } catch (error) {
        console.error('Scraping Error:', error.message);
        return res.status(200).json({ 
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
