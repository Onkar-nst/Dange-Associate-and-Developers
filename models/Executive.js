const mongoose = require('mongoose');
const { ALL_ROLES, ROLES } = require('../utils/constants');

/**
 * Executive Model
 * Stores executive details with reference to User
 * Used for assignment to customers and commission tracking
 */
const ExecutiveSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: [true, 'Please add executive code']
    },
    name: {
        type: String,
        required: [true, 'Please add executive name'],
        trim: true
    },
    senior: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Executive'
    },
    rexPerSqFt: {
        type: Number,
        default: 0
    },
    phone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    role: {
        type: String,
        enum: {
            values: ALL_ROLES,
            message: `Role must be one of: ${ALL_ROLES.join(', ')}`
        },
        default: ROLES.EXECUTIVE
    },
    branch: {
        type: String,
        default: 'MAIN BRANCH'
    },
    address: {
        type: String,
        trim: true
    },
    percentage: {
        type: Number,
        default: 0
    },
    rsPerSqFt: {
        type: Number,
        default: 0
    },
    joiningDate: {
        type: Date
    },
    birthDate: {
        type: Date
    },
    panCard: {
        type: String
    },
    designation: {
        type: String
    },
    password: {
        type: String
    },
    bankDetails: {
        accountHolderName: String,
        bankName: String,
        accountNo: String,
        ifscCode: String,
        status: {
            type: String,
            enum: ['YES', 'NO'],
            default: 'YES'
        }
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

module.exports = mongoose.model('Executive', ExecutiveSchema);
