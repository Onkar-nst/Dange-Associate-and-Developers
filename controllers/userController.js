const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES } = require('../utils/constants');

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Private (The Boss only)
 */
exports.createUser = asyncHandler(async (req, res, next) => {
    const { firstName, surname, userId, password } = req.body;

    // Validate required fields
    if (!firstName || !surname || !userId || !password) {
        return res.status(400).json({
            success: false,
            error: 'Please provide firstName, surname, userId, and password'
        });
    }

    // Check if userId already exists
    const existingUser = await User.findOne({ userId: userId.toLowerCase() });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: 'User ID already exists'
        });
    }

    // Create user
    const user = await User.create({
        ...req.body,
        createdBy: req.user.id
    });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
    });
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (The Boss only)
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
    // Query parameters for filtering
    const { role, active } = req.query;

    // Build query
    let query = {};

    if (role) {
        query.role = role;
    }

    if (active !== undefined) {
        query.active = active === 'true';
    }

    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (The Boss only)
 */
exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (The Boss only)
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
    let user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User found'
        });
    }

    user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
    });
});

/**
 * @desc    Deactivate user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (The Boss only)
 */
exports.deactivateUser = asyncHandler(async (req, res, next) => {
    let user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }

    // Soft delete - set active to false
    user = await User.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: user
    });
});

/**
 * @desc    Reset user password
 * @route   PUT /api/users/:id/resetpassword
 * @access  Private (The Boss only)
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a password with at least 6 characters'
        });
    }

    let user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successfully'
    });
});

/**
 * @desc    Get list of all users/executives for dropdowns
 * @route   GET /api/users/list
 * @access  Private (All authenticated users)
 */
exports.getUsersList = asyncHandler(async (req, res, next) => {
    const users = await User.find({ active: true })
        .select('firstName middleName surname role userId')
        .sort({ firstName: 1 });

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});
