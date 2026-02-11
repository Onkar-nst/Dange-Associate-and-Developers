const express = require('express');
const router = express.Router();
const {
    getPartyLedger,
    createLedgerEntry,
    deleteLedgerEntry
} = require('../controllers/ledgerController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', createLedgerEntry);
router.get('/:partyId', getPartyLedger);
router.delete('/:id', deleteLedgerEntry);

module.exports = router;
