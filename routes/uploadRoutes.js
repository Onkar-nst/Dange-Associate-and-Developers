const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

/**
 * @desc    Upload file
 * @route   POST /api/upload
 * @access  Private
 */
router.post('/', protect, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'Please upload a file'
        });
    }

    res.status(200).json({
        success: true,
        data: `/uploads/documents/${req.file.filename}`
    });
});

module.exports = router;
