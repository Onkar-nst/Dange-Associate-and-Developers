const express = require('express');
const router = express.Router();
const { getContext, query } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/context', getContext);
router.post('/query', query);

module.exports = router;
