/**
 * Application Constants
 * Centralized location for all constant values
 */

// User Roles - STRICT as per requirements
const ROLES = {
    EXECUTIVE: 'Executive',
    HEAD_EXECUTIVE: 'Head Executive',
    THE_BOSS: 'The Boss'
};

// All roles array for validation
const ALL_ROLES = Object.values(ROLES);

// Plot/Unit Status
const PLOT_STATUS = {
    VACANT: 'vacant',
    BOOKED: 'booked',
    SOLD: 'sold',
    HOLD: 'hold'
};

const ALL_PLOT_STATUS = Object.values(PLOT_STATUS);

// Payment Modes
const PAYMENT_MODES = {
    CASH: 'cash',
    BANK: 'bank',
    UPI: 'upi'
};

const ALL_PAYMENT_MODES = Object.values(PAYMENT_MODES);

// Party Types for Ledger
const PARTY_TYPES = {
    CUSTOMER: 'customer',
    EXECUTIVE: 'executive',
    LEDGER_ACCOUNT: 'ledger_account'
};

const ALL_PARTY_TYPES = Object.values(PARTY_TYPES);

module.exports = {
    ROLES,
    ALL_ROLES,
    PLOT_STATUS,
    ALL_PLOT_STATUS,
    PAYMENT_MODES,
    ALL_PAYMENT_MODES,
    PARTY_TYPES,
    ALL_PARTY_TYPES
};

// Commission Constants
const COMMISSION_TYPES = {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed'
};

const COMMISSION_TRIGGERS = {
    DEAL_CLOSED: 'deal_closed',         // When customer is created/plot sold
    PAYMENT_RECEIVED: 'payment_received' // When transaction is recorded
};

const COMMISSION_BASIS = {
    FULL_DEAL_VALUE: 'full_deal_value',
    RECEIVED_AMOUNT: 'received_amount'
};

const COMMISSION_STATUS = {
    EARNED: 'earned',   // Calculated but not yet paid (liability)
    PAID: 'paid',       // Paid out to executive
    PENDING: 'pending'  // Waiting for some condition (optional, but requested)
};

module.exports = {
    ROLES,
    ALL_ROLES,
    PLOT_STATUS,
    ALL_PLOT_STATUS,
    PAYMENT_MODES,
    ALL_PAYMENT_MODES,
    PARTY_TYPES,
    ALL_PARTY_TYPES,
    COMMISSION_TYPES,
    COMMISSION_TRIGGERS,
    COMMISSION_BASIS,
    COMMISSION_STATUS
};
