const express = require('express');
const {
    getLedgerAccounts,
    createLedgerAccount,
    updateLedgerAccount,
    getAccountTransactions,
    deleteLedgerAccount
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
    .put(updateLedgerAccount)
    .delete(deleteLedgerAccount);

router
    .route('/:id/transactions')
    .get(getAccountTransactions);

module.exports = router;
