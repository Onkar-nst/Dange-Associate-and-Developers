const express = require('express');
const router = express.Router();
const {
    createCurrency,
    getCurrencies,
    updateCurrency,
    deactivateCurrency
} = require('../controllers/currencyController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .post(createCurrency)
    .get(getCurrencies);

router.route('/:id')
    .put(updateCurrency)
    .delete(deactivateCurrency);

module.exports = router;
