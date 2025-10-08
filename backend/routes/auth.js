const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');

// /api/auth/register
router.post('/register', register);

// /api/auth/login
router.post('/login', login);

// /api/auth/me
router.get('/me', authMiddleware, getMe);

module.exports = router;