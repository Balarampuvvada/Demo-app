const express = require('express');
const {
  createUser,
  createSite,
  getAllUsers,
  deleteUser,
  updateSite,
  addCheckpoint,
  deleteCheckpoint,
  deleteSite
} = require('../controllers/admin.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require SUPERVISOR role
router.use(authMiddleware);
router.use(roleMiddleware('SUPERVISOR'));

// User management
router.post('/users', createUser);
router.get('/users', getAllUsers);
router.delete('/users/:userId', deleteUser);

// Site management
router.post('/sites', createSite);
router.put('/sites/:siteId', updateSite);
router.delete('/sites/:siteId', deleteSite);

// Checkpoint management
router.post('/sites/:siteId/checkpoints', addCheckpoint);
router.delete('/checkpoints/:checkpointId', deleteCheckpoint);

module.exports = router;
