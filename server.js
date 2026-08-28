const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/facebook', async (req, res) => {
    let fbUrl = req.query.url;
    if (!fbUrl) {
        return res.status(400).json({ status: false, error: "Please provide a Facebook URL using ?url=" });
    }

    try {
        // Fetching Facebook page HTML using mobile user-agent to easily parse video links
        const response = await axios.get(fbUrl, {
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
            return res.json({
                status: true,
                result: {
                    hd: hdVideo || sdVideo,
                    sd: sdVideo || hdVideo
                }
            });
        } else {
            return res.status(404).json({ status: false, message: "Could not fetch Facebook video. Make sure the post is Public!" });
        }

    } catch (error) {
        return res.status(500).json({ status: false, error: "Failed to process Facebook link." });
    }
});

// Download Proxy to force direct file download without opening tabs
app.get('/api/download-proxy', async (req, res) => {
    const fileUrl = req.query.url;
    if (!fileUrl) return res.status(400).send("Missing URL");

    try {
        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        res.setHeader('Content-Disposition', 'attachment; filename="Facebook-Video.mp4"');
        res.setHeader('Content-Type', 'video/mp4');
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send("Download failed.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Facebook Server running on port ${PORT}`));
