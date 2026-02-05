const mongoose = require('mongoose');

/**
 * Project Model
 * Represents a land development project
 * Contains reference to who created the project
 */
const ProjectSchema = new mongoose.Schema({
    branch: {
        type: String,
        default: 'MAIN BRANCH'
    },
    projectCode: {
        type: String,
        required: [true, 'Please add a project code'],
        unique: true,
        maxlength: [4, 'Project code cannot be more than 4 characters'],
        match: [/^[a-zA-Z0-9]{1,4}$/, 'Only 4 alphanumeric characters allowed, no spaces or special characters']
    },
    projectName: {
        type: String,
        required: [true, 'Please add a project name'],
        trim: true,
        unique: true,
        maxlength: [200, 'Project name cannot be more than 200 characters']
    },
    mauza: {
        type: String,
        trim: true
    },
    khasara: {
        type: String,
        trim: true
    },
    phn: {
        type: String,
        trim: true
    },
    taluka: {
        type: String,
        trim: true
    },
    district: {
        type: String,
        trim: true
    },
    totalPlots: { // No. of Plots
        type: Number,
        required: [true, 'Please add total number of plots'],
        min: [1, 'Total plots must be at least 1']
    },
    status: {
        type: String,
        enum: ['Open', 'Close'],
        default: 'Open'
    },
    area: {
        type: String,
        trim: true
    },
    saleType: {
        type: String,
        default: 'Current'
    },
    projectDetails: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Please add a location'],
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual to get available plots count
ProjectSchema.virtual('availablePlots', {
    ref: 'Plot',
    localField: '_id',
    foreignField: 'projectId',
    count: true,
    match: { status: 'vacant', active: true }
});

// Enable virtuals in JSON
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', ProjectSchema);
