const express = require('express');
const router = express.Router();
const { register, login, verifyToken, changePassword, updateAvatar } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/verify - Verify token and get user
router.get('/verify', authMiddleware, verifyToken);

// PATCH /api/auth/change-password - Change password
router.patch('/change-password', authMiddleware, changePassword);

// PATCH /api/auth/update-avatar - Update avatar
router.patch('/update-avatar', authMiddleware, updateAvatar);

module.exports = router;
