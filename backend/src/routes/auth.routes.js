const express = require('express');
const { login, getCurrentUser } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
