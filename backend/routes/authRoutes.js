const express = require('express');
const router = express.Router();
const { register, login, verifyToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/verify - Verify token and get user
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;
