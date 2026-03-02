const express = require('express');
const router = express.Router();
const {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    deactivateCustomer,
    getCustomerSummary,
    cancelCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .post(createCustomer)
    .get(getCustomers);

router.route('/:id')
    .get(getCustomer)
    .put(updateCustomer)
    .delete(deactivateCustomer);

router.get('/:id/summary', getCustomerSummary);
router.post('/:id/cancel', cancelCustomer);

module.exports = router;
