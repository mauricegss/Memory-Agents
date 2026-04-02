const express = require('express');
const router = express.Router();

router.get('/images', async (req, res) => {
    const { theme } = req.query;
    try {
        res.json({ success: true, theme, images: [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
