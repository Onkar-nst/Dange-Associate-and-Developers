const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = asyncHandler(async (req, res, next) => {
    const { projectCode, projectName, location, totalPlots } = req.body;

    // Validate required fields
    if (!projectCode || !projectName || !location || !totalPlots) {
        return res.status(400).json({
            success: false,
            error: 'Please provide projectCode, projectName, location, and totalPlots'
        });
    }

    // Check if project name already exists
    const existingProject = await Project.findOne({ projectName });
    if (existingProject) {
        return res.status(400).json({
            success: false,
            error: 'Project with this name already exists'
        });
    }

    // Check if project code already exists
    const existingCode = await Project.findOne({ projectCode });
    if (existingCode) {
        return res.status(400).json({
            success: false,
            error: 'Project with this code already exists'
        });
    }

    // Create project
    const project = await Project.create({
        ...req.body,
        createdBy: req.user.id
    });

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
    });
});

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = asyncHandler(async (req, res, next) => {
    const { active, location } = req.query;

    // Build query
    let query = {};

    if (active !== undefined) {
        query.active = active === 'true';
    } else {
        // By default, show only active projects
        query.active = true;
    }

    if (location) {
        query.location = { $regex: location, $options: 'i' };
    }

    const projects = await Project.find(query)
        .populate('createdBy', 'name userId')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
    });
});

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProject = asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.id)
        .populate('createdBy', 'name userId');

    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found'
        });
    }

    res.status(200).json({
        success: true,
        data: project
    });
});

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = asyncHandler(async (req, res, next) => {
    const { projectName, location, totalPlots, description, active } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found'
        });
    }

    // Check for duplicate project name if being changed
    if (projectName && projectName !== project.projectName) {
        const existingProject = await Project.findOne({ projectName });
        if (existingProject) {
            return res.status(400).json({
                success: false,
                error: 'Project with this name already exists'
            });
        }
    }

    // Prepare update object
    const updateData = {};
    if (projectName) updateData.projectName = projectName;
    if (location) updateData.location = location;
    if (totalPlots) updateData.totalPlots = totalPlots;
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = active;

    project = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate('createdBy', 'name userId');

    res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project
    });
});

/**
 * @desc    Deactivate project (soft delete)
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deactivateProject = asyncHandler(async (req, res, next) => {
    let project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found'
        });
    }

    // Soft delete - set active to false
    project = await Project.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: 'Project deactivated successfully',
        data: project
    });
});
