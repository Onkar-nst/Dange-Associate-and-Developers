const express = require('express');
const {
    getLedgerAccounts,
    createLedgerAccount,
    updateLedgerAccount,
    getAccountTransactions
} = require('../controllers/ledgerAccountController');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router
    .route('/')
    .get(getLedgerAccounts)
    .post(createLedgerAccount);

router
    .route('/:id')
    .put(updateLedgerAccount);

router
    .route('/:id/transactions')
    .get(getAccountTransactions);

module.exports = router;
