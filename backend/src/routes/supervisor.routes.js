const express = require('express');
const {
  getLivePatrols,
  getAlerts,
  getAllShifts,
  getGuardsOnDuty,
  getPatrolTimeline
} = require('../controllers/supervisor.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/live-patrols', authMiddleware, roleMiddleware('SUPERVISOR'), getLivePatrols);
router.get('/alerts', authMiddleware, roleMiddleware('SUPERVISOR'), getAlerts);
router.get('/shifts', authMiddleware, roleMiddleware('SUPERVISOR'), getAllShifts);
router.get('/guards-on-duty', authMiddleware, roleMiddleware('SUPERVISOR'), getGuardsOnDuty);
router.get('/patrol-timeline', authMiddleware, roleMiddleware('SUPERVISOR'), getPatrolTimeline);

module.exports = router;
