const express = require('express');
const router = express.Router();
const {
    createTransaction,
    getCustomerTransactions,
    getAllTransactions,
    getTransaction,
    deactivateTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .post(createTransaction)
    .get(getAllTransactions);

router.get('/single/:id', getTransaction);
router.delete('/single/:id', deactivateTransaction);
router.get('/:customerId', getCustomerTransactions);

module.exports = router;
