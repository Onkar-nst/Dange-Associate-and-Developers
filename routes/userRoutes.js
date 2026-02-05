const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deactivateUser,
    resetPassword,
    getUsersList
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

// All routes require authentication and The Boss role
// All routes require authentication
router.use(protect);

// Public list for dropdowns (must be before Role restriction)
router.get('/list', getUsersList);

// Restrict following routes to The Boss
router.use(authorize(ROLES.THE_BOSS));

router.route('/')
    .post(createUser)
    .get(getUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deactivateUser);

router.put('/:id/resetpassword', resetPassword);

module.exports = router;
