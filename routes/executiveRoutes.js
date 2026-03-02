const express = require('express');
const router = express.Router();
const {
    createExecutive,
    getExecutives,
    getExecutive,
    updateExecutive,
    deleteExecutive
} = require('../controllers/executiveController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .post(createExecutive)
    .get(getExecutives);

router.route('/:id')
    .get(getExecutive)
    .put(updateExecutive)
    .delete(deleteExecutive);

module.exports = router;
