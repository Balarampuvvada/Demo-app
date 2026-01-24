const express = require('express');
const {
  startShift,
  endShift,
  logCheckpoint,
  getShiftDetails,
  getActiveShift,
  getPatrolHistory
} = require('../controllers/patrol.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/start-shift', authMiddleware, roleMiddleware('GUARD'), startShift);
router.put('/end-shift/:shiftId', authMiddleware, roleMiddleware('GUARD'), endShift);
router.post('/log-checkpoint', authMiddleware, roleMiddleware('GUARD'), logCheckpoint);
router.get('/shift/:shiftId', authMiddleware, getShiftDetails);
router.get('/active-shift', authMiddleware, roleMiddleware('GUARD'), getActiveShift);
router.get('/history', authMiddleware, roleMiddleware('GUARD'), getPatrolHistory);

module.exports = router;
