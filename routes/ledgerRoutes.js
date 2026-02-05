const express = require('express');
const router = express.Router();
const {
    getPartyLedger,
    createLedgerEntry
} = require('../controllers/ledgerController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', createLedgerEntry);
router.get('/:partyId', getPartyLedger);

module.exports = router;
