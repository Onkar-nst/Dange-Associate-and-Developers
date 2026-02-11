const mongoose = require('mongoose');

/**
 * Customer Model
 * Represents a customer who purchased a plot
 * Creating a customer automatically marks plot as 'sold'
 */
const CustomerSchema = new mongoose.Schema({
    title: {
        type: String,
        enum: ['Mr.', 'Mrs.', 'Ms.', 'Dr.'],
        default: 'Mr.'
    },
    firstName: {
        type: String,
        required: [true, 'Please add first name'],
        trim: true
    },
    middleName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Please add last name'],
        trim: true
    },
    name: { // Keeping for backward compatibility or derived use
        type: String,
        trim: true
    },
    occupation: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please add customer address'],
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    pinCode: {
        type: String,
        trim: true
    },
    age: {
        type: Number
    },
    birthDate: {
        type: Date
    },
    marriageDate: {
        type: Date
    },
    phone: {
        type: String,
        required: [true, 'Please add phone number'],
        match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number']
    },
    alternatePhone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    branch: {
        type: String,
        trim: true
    },
    panNo: {
        type: String,
        trim: true
    },
    aadharNo: {
        type: String,
        trim: true
    },
    panCardImage: {
        type: String
    },
    aadharCardImage: {
        type: String
    },
    // Nominee Detail
    nomineeName: {
        type: String,
        trim: true
    },
    nomineeAge: {
        type: Number
    },
    nomineeRelation: {
        type: String,
        trim: true
    },
    nomineeBirthDate: {
        type: Date
    },
    nomineeAadharNo: {
        type: String,
        trim: true
    },
    nomineePanNo: {
        type: String,
        trim: true
    },
    nomineePanCardImage: {
        type: String
    },
    nomineeAadharCardImage: {
        type: String
    },
    // Project/Transaction Detail
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Please add project reference']
    },
    plotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plot',
        required: [true, 'Please add plot reference']
    },
    measurement: {
        type: String,
        trim: true
    },
    sqMtr: {
        type: Number
    },
    sqFt: {
        type: Number
    },
    rate: {
        type: Number
    },
    dealValue: { // Total Cost
        type: Number,
        required: [true, 'Please add deal value']
    },
    paidAmount: { // Down Payment
        type: Number,
        default: 0
    },
    balanceAmount: {
        type: Number
    },
    tenure: {
        type: Number
    },
    emiAmount: {
        type: Number
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    agreementDate: {
        type: Date
    },
    emiStartDate: {
        type: Date
    },
    transactionStatus: {
        type: String,
        enum: ['Token', 'Booked', 'Agreement', 'Registered', 'Cancelled'],
        default: 'Token'
    },
    remarks: {
        type: String,
        trim: true
    },
    documents: [{
        name: { type: String, required: true },
        path: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    aRate: {
        type: Number
    },
    assignedExecutive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedExecutives: [{
        executiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        percentage: { type: Number, default: 0 }
    }],
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

// Calculate balance amount and full name before saving
CustomerSchema.pre('save', async function () {
    this.balanceAmount = this.dealValue - this.paidAmount;
    this.name = `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
});

// Index for faster lookups
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ projectId: 1, plotId: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);
