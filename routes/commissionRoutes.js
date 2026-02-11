const express = require('express');
const router = express.Router();
const {
    createRule,
    getRules,
    getExecutiveLedger,
    payCommission,
    deleteRule
} = require('../controllers/commissionController');

const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(protect); // All routes require login

router.route('/rules')
    .post(authorize(ROLES.THE_BOSS), createRule)
    .get(authorize(ROLES.THE_BOSS), getRules);

router.route('/rules/:id')
    .delete(authorize(ROLES.THE_BOSS), deleteRule);

router.route('/executive/:id')
    .get(authorize(ROLES.THE_BOSS, ROLES.EXECUTIVE, ROLES.HEAD_EXECUTIVE), getExecutiveLedger);

router.route('/pay')
    .post(authorize(ROLES.THE_BOSS), payCommission);

module.exports = router;
