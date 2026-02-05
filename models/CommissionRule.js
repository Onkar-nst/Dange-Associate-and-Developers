const mongoose = require('mongoose');
const {
    ROLES,
    COMMISSION_TYPES,
    COMMISSION_TRIGGERS,
    COMMISSION_BASIS
} = require('../utils/constants');

/**
 * CommissionRule Model
 * Defines how commissions are calculated
 */
const CommissionRuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add rule name'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    // Which role this rule applies to
    appliesToRole: {
        type: String,
        enum: [ROLES.EXECUTIVE, ROLES.HEAD_EXECUTIVE],
        required: [true, 'Please specify which role this rule applies to']
    },
    // Calculation method
    type: {
        type: String,
        enum: Object.values(COMMISSION_TYPES),
        required: [true, 'Please add commission type']
    },
    value: {
        type: Number,
        required: [true, 'Please add commission value'],
        min: 0
    },
    // When to calculate
    triggerEvent: {
        type: String,
        enum: Object.values(COMMISSION_TRIGGERS),
        required: [true, 'Please add trigger event']
    },
    // On what amount
    basis: {
        type: String,
        enum: Object.values(COMMISSION_BASIS),
        required: [true, 'Please add commission basis']
    },
    // Scope (Global if null, or specific project)
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
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

// Helper to find applicable rules
CommissionRuleSchema.statics.findApplicableRules = function (role, projectId) {
    return this.find({
        active: true,
        appliesToRole: role,
        $or: [
            { projectId: null },      // Global rules
            { projectId: projectId }  // Project specific rules
        ]
    });
};

module.exports = mongoose.model('CommissionRule', CommissionRuleSchema);
