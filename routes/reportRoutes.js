const express = require('express');
const router = express.Router();
const {
    getSalesReport,
    getCollectionReport,
    getOutstandingReport,
    getExecutivePerformanceReport,
    getLedgerReport,
    getDetailedCustomerStatement,
    getCustomerDuesReport,
    getCashBook,
    getProjectSummary,
    getSalesPositionSummary,
    getProjectReceiptPaymentSummary,
    getDailyCollectionRegister,
    getMonthlyEMIReminder,
    getTokenByExecutive,
    getExecutiveCustomerReminder,
    getUnitCalculation,
    getUserDailyCollection,
    getCustomerEMIDues,
    getCustomerDetailedLedger,
    getExecutiveBusinessReport,
    getBirthdayAnniversaryReminders
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

// All report routes are protected and restricted to Boss and Head Executive
router.use(protect);
router.use(authorize(ROLES.THE_BOSS, ROLES.HEAD_EXECUTIVE));

router.get('/sales', getSalesReport);
router.get('/collection', getCollectionReport);
router.get('/outstanding', getOutstandingReport);
router.get('/executive-performance', getExecutivePerformanceReport);
router.get('/ledger', getLedgerReport);
router.get('/customer-statement', getDetailedCustomerStatement);
router.get('/dues', getCustomerDuesReport);
router.get('/cash-book', getCashBook);
router.get('/dashboard-project-summary', getProjectSummary);
router.get('/dashboard-sales-position', getSalesPositionSummary);
router.get('/dashboard-rp-summary', getProjectReceiptPaymentSummary);
router.get('/daily-collection', getDailyCollectionRegister);
router.get('/monthly-emi-reminder', getMonthlyEMIReminder);
router.get('/token-by-executive', getTokenByExecutive);
router.get('/executive-reminder', getExecutiveCustomerReminder);
router.get('/unit-calculation', getUnitCalculation);
router.get('/user-daily-collection', getUserDailyCollection);
router.get('/customer-emi-dues', getCustomerEMIDues);
router.get('/customer-ledger/:id', getCustomerDetailedLedger);
router.get('/executive-business', getExecutiveBusinessReport);
router.get('/birthday-reminders', getBirthdayAnniversaryReminders);

module.exports = router;

