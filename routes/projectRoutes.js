const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deactivateProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .post(createProject)
    .get(getProjects);

router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deactivateProject);

module.exports = router;
