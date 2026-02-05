const express = require('express');
const router = express.Router();
const {
    createPlot,
    createBulkPlots,
    getPlots,
    getPlot,
    updatePlot,
    deactivatePlot,
    getPlotStats
} = require('../controllers/plotController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .post(createPlot)
    .get(getPlots);

router.post('/bulk', createBulkPlots);
router.get('/stats/:projectId', getPlotStats);

router.route('/:id')
    .get(getPlot)
    .put(updatePlot)
    .delete(deactivatePlot);

module.exports = router;
