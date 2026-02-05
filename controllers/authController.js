const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
    const { userId, password } = req.body;

    // Validate userId and password
    if (!userId || !password) {
        return res.status(400).json({
            success: false,
            error: 'Please provide userId and password'
        });
    }

    // Find user by userId and include password
    const user = await User.findOne({ userId: userId.toLowerCase() }).select('+password');

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'not a valid user'
        });
    }

    // Check if user is active
    if (!user.active) {
        return res.status(401).json({
            success: false,
            error: 'Your account has been deactivated. Please contact administrator.'
        });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            error: 'not a valid user'
        });
    }

    // Generate token and send response
    sendTokenResponse(user, 200, res);
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        data: {}
    });
});

/**
 * Helper function to create token and send response
 * @param {Object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        data: {
            id: user._id,
            firstName: user.firstName,
            surname: user.surname,
            userId: user.userId,
            role: user.role
        }
    });
};
