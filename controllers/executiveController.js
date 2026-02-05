const Executive = require('../models/Executive');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Create a new executive
 * @route   POST /api/executives
 * @access  Private
 */
exports.createExecutive = asyncHandler(async (req, res, next) => {
    const {
        code, name, senior, rexPerSqFt, phone, email, userId, role,
        branch, address, percentage, rsPerSqFt, joiningDate, birthDate,
        panCard, designation, password, bankDetails
    } = req.body;

    // Validate required fields
    if (!code || !name || !phone) {
        return res.status(400).json({
            success: false,
            error: 'Please provide code, name and phone number'
        });
    }

    // Check if code is already taken
    const existingExecutive = await Executive.findOne({ code });
    if (existingExecutive) {
        return res.status(400).json({
            success: false,
            error: 'Executive code already exists'
        });
    }

    // Create executive
    const executive = await Executive.create({
        code, name, senior, rexPerSqFt, phone, email, userId, role,
        branch, address, percentage, rsPerSqFt, joiningDate, birthDate,
        panCard, designation, password, bankDetails
    });

    res.status(201).json({
        success: true,
        message: 'Executive created successfully',
        data: executive
    });
});

/**
 * @desc    Get all executives
 * @route   GET /api/executives
 * @access  Private
 */
exports.getExecutives = asyncHandler(async (req, res, next) => {
    const { role, active } = req.query;

    // Build query
    let query = {};

    if (role) {
        query.role = role;
    }

    if (active !== undefined) {
        query.active = active === 'true';
    }

    const executives = await Executive.find(query)
        .populate('userId', 'name userId role')
        .populate('senior', 'name code')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: executives.length,
        data: executives
    });
});

/**
 * @desc    Get single executive by ID
 * @route   GET /api/executives/:id
 * @access  Private
 */
exports.getExecutive = asyncHandler(async (req, res, next) => {
    const executive = await Executive.findById(req.params.id)
        .populate('userId', 'name userId role');

    if (!executive) {
        return res.status(404).json({
            success: false,
            error: 'Executive not found'
        });
    }

    res.status(200).json({
        success: true,
        data: executive
    });
});

/**
 * @desc    Update executive
 * @route   PUT /api/executives/:id
 * @access  Private
 */
exports.updateExecutive = asyncHandler(async (req, res, next) => {
    const {
        name, phone, email, role, branch, address, active,
        senior, rexPerSqFt, percentage, rsPerSqFt, joiningDate,
        birthDate, panCard, designation, password, bankDetails
    } = req.body;

    let executive = await Executive.findById(req.params.id);

    if (!executive) {
        return res.status(404).json({
            success: false,
            error: 'Executive not found'
        });
    }

    // Update fields if provided
    if (name) executive.name = name;
    if (phone) executive.phone = phone;
    if (email !== undefined) executive.email = email;
    if (role) executive.role = role;
    if (branch !== undefined) executive.branch = branch;
    if (address !== undefined) executive.address = address;
    if (active !== undefined) executive.active = active;
    if (senior !== undefined) executive.senior = senior;
    if (rexPerSqFt !== undefined) executive.rexPerSqFt = rexPerSqFt;
    if (percentage !== undefined) executive.percentage = percentage;
    if (rsPerSqFt !== undefined) executive.rsPerSqFt = rsPerSqFt;
    if (joiningDate !== undefined) executive.joiningDate = joiningDate;
    if (birthDate !== undefined) executive.birthDate = birthDate;
    if (panCard !== undefined) executive.panCard = panCard;
    if (designation !== undefined) executive.designation = designation;
    if (password !== undefined) executive.password = password;
    if (bankDetails !== undefined) executive.bankDetails = bankDetails;

    await executive.save();

    executive = await Executive.findById(req.params.id)
        .populate('userId', 'name userId role')
        .populate('senior', 'name code');

    res.status(200).json({
        success: true,
        message: 'Executive updated successfully',
        data: executive
    });
});

/**
 * @desc    Deactivate executive (soft delete)
 * @route   DELETE /api/executives/:id
 * @access  Private
 */
exports.deactivateExecutive = asyncHandler(async (req, res, next) => {
    let executive = await Executive.findById(req.params.id);

    if (!executive) {
        return res.status(404).json({
            success: false,
            error: 'Executive not found'
        });
    }

    // Soft delete
    executive = await Executive.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: 'Executive deactivated successfully',
        data: executive
    });
});
