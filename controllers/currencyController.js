const Currency = require('../models/Currency');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Create a new currency
 * @route   POST /api/currency
 * @access  Private
 */
exports.createCurrency = asyncHandler(async (req, res, next) => {
    const { currencyName, symbol, code } = req.body;

    if (!currencyName || !symbol) {
        return res.status(400).json({
            success: false,
            error: 'Please provide currencyName and symbol'
        });
    }

    const existingCurrency = await Currency.findOne({ currencyName });
    if (existingCurrency) {
        return res.status(400).json({
            success: false,
            error: 'Currency already exists'
        });
    }

    const currency = await Currency.create({ currencyName, symbol, code });

    res.status(201).json({
        success: true,
        message: 'Currency created successfully',
        data: currency
    });
});

/**
 * @desc    Get all currencies
 * @route   GET /api/currency
 * @access  Private
 */
exports.getCurrencies = asyncHandler(async (req, res, next) => {
    const { active } = req.query;
    let query = {};
    if (active !== undefined) {
        query.active = active === 'true';
    } else {
        query.active = true;
    }

    const currencies = await Currency.find(query).sort({ currencyName: 1 });

    res.status(200).json({
        success: true,
        count: currencies.length,
        data: currencies
    });
});

/**
 * @desc    Update currency
 * @route   PUT /api/currency/:id
 * @access  Private
 */
exports.updateCurrency = asyncHandler(async (req, res, next) => {
    const { currencyName, symbol, code, active } = req.body;

    let currency = await Currency.findById(req.params.id);
    if (!currency) {
        return res.status(404).json({
            success: false,
            error: 'Currency not found'
        });
    }

    const updateData = {};
    if (currencyName) updateData.currencyName = currencyName;
    if (symbol) updateData.symbol = symbol;
    if (code !== undefined) updateData.code = code;
    if (active !== undefined) updateData.active = active;

    currency = await Currency.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.status(200).json({
        success: true,
        message: 'Currency updated successfully',
        data: currency
    });
});

/**
 * @desc    Deactivate currency
 * @route   DELETE /api/currency/:id
 * @access  Private
 */
exports.deactivateCurrency = asyncHandler(async (req, res, next) => {
    let currency = await Currency.findById(req.params.id);
    if (!currency) {
        return res.status(404).json({ success: false, error: 'Currency not found' });
    }

    currency = await Currency.findByIdAndUpdate(req.params.id, { active: false }, { new: true });

    res.status(200).json({
        success: true,
        message: 'Currency deactivated successfully',
        data: currency
    });
});
