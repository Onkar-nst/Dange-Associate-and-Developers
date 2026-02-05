const express = require('express');
const router = express.Router();
const { createJV, getJVs, deleteJV } = require('../controllers/jvController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getJVs)
    .post(createJV);

router.route('/:id')
    .delete(deleteJV);

module.exports = router;
