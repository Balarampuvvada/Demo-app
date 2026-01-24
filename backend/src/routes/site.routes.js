const express = require('express');
const { getAllSites, getSiteById } = require('../controllers/site.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, getAllSites);
router.get('/:siteId', authMiddleware, getSiteById);

module.exports = router;
