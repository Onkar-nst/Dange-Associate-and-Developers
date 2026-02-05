const mongoose = require('mongoose');

/**
 * Currency Model
 * Master data for currency types
 */
const CurrencySchema = new mongoose.Schema({
    currencyName: {
        type: String,
        required: [true, 'Please add currency name'],
        unique: true,
        trim: true
    },
    symbol: {
        type: String,
        required: [true, 'Please add currency symbol'],
        trim: true
    },
    code: {
        type: String,
        trim: true,
        uppercase: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Currency', CurrencySchema);
