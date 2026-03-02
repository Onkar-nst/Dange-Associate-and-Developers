const express = require('express');
const router = express.Router();
const { createJV, getJVs, updateJV, deleteJV } = require('../controllers/jvController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getJVs)
    .post(createJV);

router.route('/:id')
    .put(updateJV)
    .delete(deleteJV);

module.exports = router;
