const Plot = require('../models/Plot');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { PLOT_STATUS } = require('../utils/constants');

/**
 * @desc    Create a new plot
 * @route   POST /api/plots
 * @access  Private
 */
exports.createPlot = asyncHandler(async (req, res, next) => {
    // Validate required fields
    const { plotNumber, size, rate, projectId } = req.body;
    if (!plotNumber || !size || !rate || !projectId) {
        return res.status(400).json({
            success: false,
            error: 'Please provide plotNumber, size, rate, and projectId'
        });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found'
        });
    }

    // Check if plot number already exists in the same project
    const existingPlot = await Plot.findOne({ plotNumber, projectId });
    if (existingPlot) {
        return res.status(400).json({
            success: false,
            error: 'Plot number already exists in this project'
        });
    }

    // Create plot with all fields from body
    const plot = await Plot.create({
        ...req.body,
        status: req.body.status || PLOT_STATUS.AVAILABLE,
        createdBy: req.user.id
    });

    res.status(201).json({
        success: true,
        message: 'Plot created successfully',
        data: plot
    });
});

/**
 * @desc    Bulk create plots for a project
 * @route   POST /api/plots/bulk
 * @access  Private
 */
exports.createBulkPlots = asyncHandler(async (req, res, next) => {
    const { projectId, plots } = req.body;

    // Validate required fields
    if (!projectId || !plots || !Array.isArray(plots) || plots.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Please provide projectId and an array of plots'
        });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            error: 'Project not found'
        });
    }

    // Prepare plots with projectId and createdBy
    const plotsToCreate = plots.map(plot => ({
        ...plot,
        projectId,
        status: plot.status || PLOT_STATUS.VACANT,
        createdBy: req.user.id
    }));

    // Insert many plots
    const createdPlots = await Plot.insertMany(plotsToCreate, { ordered: false });

    res.status(201).json({
        success: true,
        message: `${createdPlots.length} plots created successfully`,
        count: createdPlots.length,
        data: createdPlots
    });
});

/**
 * @desc    Get plots with optional projectId filter
 * @route   GET /api/plots
 * @query   projectId, status, active
 * @access  Private
 */
exports.getPlots = asyncHandler(async (req, res, next) => {
    const { projectId, status, active } = req.query;

    // Build query
    let query = {};

    if (projectId) {
        query.projectId = projectId;
    }

    if (status) {
        query.status = status;
    }

    if (active !== undefined) {
        query.active = active === 'true';
    } else {
        query.active = true;
    }

    const plots = await Plot.find(query)
        .populate('projectId', 'projectName location')
        .populate('createdBy', 'name')
        .sort({ plotNumber: 1 });

    res.status(200).json({
        success: true,
        count: plots.length,
        data: plots
    });
});

/**
 * @desc    Get single plot by ID
 * @route   GET /api/plots/:id
 * @access  Private
 */
exports.getPlot = asyncHandler(async (req, res, next) => {
    const plot = await Plot.findById(req.params.id)
        .populate('projectId', 'projectName location')
        .populate('createdBy', 'name');

    if (!plot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found'
        });
    }

    res.status(200).json({
        success: true,
        data: plot
    });
});

/**
 * @desc    Update plot
 * @route   PUT /api/plots/:id
 * @access  Private
 */
exports.updatePlot = asyncHandler(async (req, res, next) => {
    let plot = await Plot.findById(req.params.id);

    if (!plot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found'
        });
    }

    // If plot is sold, restrict what can be updated
    if (plot.status === PLOT_STATUS.SOLD) {
        const updateData = {};
        if (req.body.remarks !== undefined) updateData.remarks = req.body.remarks;

        plot = await Plot.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Plot updated (limited fields for sold plot)',
            data: plot
        });
    }

    // Check for duplicate plot number if being changed
    if (req.body.plotNumber && req.body.plotNumber !== plot.plotNumber) {
        const existingPlot = await Plot.findOne({
            plotNumber: req.body.plotNumber,
            projectId: plot.projectId,
            _id: { $ne: req.params.id }
        });
        if (existingPlot) {
            return res.status(400).json({
                success: false,
                error: 'Plot number already exists in this project'
            });
        }
    }

    // Prepare update object from body
    const updateData = { ...req.body };

    // Calculate totalValue if size or rate is updated
    if (req.body.size || req.body.rate) {
        updateData.totalValue = (req.body.size || plot.size) * (req.body.rate || plot.rate);
    }

    plot = await Plot.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Plot updated successfully',
        data: plot
    });
});

/**
 * @desc    Deactivate plot (soft delete)
 * @route   DELETE /api/plots/:id
 * @access  Private
 */
exports.deactivatePlot = asyncHandler(async (req, res, next) => {
    let plot = await Plot.findById(req.params.id);

    if (!plot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found'
        });
    }

    // Soft delete
    plot = await Plot.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: 'Plot deactivated successfully',
        data: plot
    });
});

/**
 * @desc    Get plot statistics for a project
 * @route   GET /api/plots/stats/:projectId
 * @access  Private
 */
exports.getPlotStats = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    const stats = await Plot.aggregate([
        { $match: { projectId: require('mongoose').Types.ObjectId(projectId), active: true } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalValue' }
            }
        }
    ]);

    // Format response
    const formattedStats = {
        vacant: { count: 0, totalValue: 0 },
        booked: { count: 0, totalValue: 0 },
        sold: { count: 0, totalValue: 0 },
        hold: { count: 0, totalValue: 0 }
    };

    stats.forEach(stat => {
        if (formattedStats[stat._id]) {
            formattedStats[stat._id] = {
                count: stat.count,
                totalValue: stat.totalValue
            };
        }
    });

    res.status(200).json({
        success: true,
        data: formattedStats
    });
});
