const mongoose = require('mongoose');
const { ALL_PLOT_STATUS, PLOT_STATUS } = require('../utils/constants');

/**
 * Plot/Unit Model
 * Represents individual plots within a project
 * Status changes to 'sold' when customer is assigned
 */
const PlotSchema = new mongoose.Schema({
    plotNumber: {
        type: String,
        required: [true, 'Please add a plot number'],
        trim: true
    },
    size: {
        type: Number,
        required: [true, 'Please add plot size (in sq. ft.)']
    },
    sqMtr: {
        type: Number
    },
    measurement: {
        type: String,
        trim: true
    },
    rate: {
        type: Number,
        required: [true, 'Please add rate per sq. ft.']
    },
    status: {
        type: String,
        enum: {
            values: ALL_PLOT_STATUS,
            message: `Status must be one of: ${ALL_PLOT_STATUS.join(', ')}`
        },
        default: PLOT_STATUS.VACANT
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Please add project reference']
    },
    // Calculated field: size * rate
    totalValue: {
        type: Number
    },
    facing: {
        type: String,
        trim: true
    },
    east: {
        type: String,
        trim: true
    },
    west: {
        type: String,
        trim: true
    },
    north: {
        type: String,
        trim: true
    },
    south: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique plot numbers within a project
PlotSchema.index({ plotNumber: 1, projectId: 1 }, { unique: true });

// Pre-save middleware to calculate totalValue
PlotSchema.pre('save', async function () {
    if (this.size && this.rate) {
        this.totalValue = this.size * this.rate;
    }
});

// Pre-update middleware to calculate totalValue on update
PlotSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();
    if (update.size !== undefined || update.rate !== undefined) {
        // If both are being updated, use new values
        // Otherwise we need the current document values
        if (update.size && update.rate) {
            update.totalValue = update.size * update.rate;
        }
    }
});

module.exports = mongoose.model('Plot', PlotSchema);
