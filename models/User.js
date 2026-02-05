const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ALL_ROLES, ROLES } = require('../utils/constants');

/**
 * User Model
 * Handles user authentication and role-based access
 * Roles: Executive, Head Executive, The Boss
 */
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please add a first name'],
        trim: true
    },
    middleName: {
        type: String,
        trim: true
    },
    surname: {
        type: String,
        required: [true, 'Please add a surname'],
        trim: true
    },
    userId: {
        type: String,
        required: [true, 'Please add a user ID'],
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: [50, 'User ID cannot be more than 50 characters']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    type: {
        type: String,
        enum: ['Head', 'User'],
        default: 'User'
    },
    branch: {
        type: String,
        default: 'All'
    },
    permissions: {
        type: [String],
        default: []
    },
    role: {
        type: String,
        enum: {
            values: ALL_ROLES,
            message: `Role must be one of: ${ALL_ROLES.join(', ')}`
        },
        default: ROLES.EXECUTIVE
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

/**
 * Hash password before saving
 * Uses bcrypt with salt rounds of 12
 */
UserSchema.pre('save', async function () {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Sign and return JWT token
 * Token contains user ID and expires based on JWT_EXPIRE env variable
 */
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Password to compare
 * @returns {boolean} - True if passwords match
 */
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
