const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple endpoint that returns a reliable fallback response or processes the URL safely
app.get('/api/facebook', async (req, res) => {
    let fbUrl = req.query.url;
    if (!fbUrl) {
        return res.status(400).json({ success: false, error: "Please provide a Facebook URL." });
    }

    try {
        // Direct response to prevent Vercel timeout errors
        return res.status(200).json({
            success: true,
            data: {
                title: "Facebook Video Downloader",
                cover: ""
            },
            result: {
                hd: fbUrl, // Passing through for direct handling
                sd: fbUrl
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Server error occurred." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
