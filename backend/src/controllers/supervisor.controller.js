const prisma = require('../config/db');

const getLivePatrols = async (req, res) => {
  try {
    const activeShifts = await prisma.shift.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        guard: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        site: true,
        patrolLogs: {
          include: {
            checkpoint: true
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    res.json(activeShifts);
  } catch (error) {
    console.error('Get live patrols error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAlerts = async (req, res) => {
  try {
    const thresholdTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const activeShifts = await prisma.shift.findMany({
      where: {
        status: 'ACTIVE',
        startTime: {
          lt: thresholdTime
        }
      },
      include: {
        guard: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        site: {
          include: {
            checkpoints: true
          }
        },
        patrolLogs: {
          where: {
            timestamp: {
              gt: thresholdTime
            }
          }
        }
      }
    });

    const alerts = activeShifts.map(shift => {
      const totalCheckpoints = shift.site.checkpoints.length;
      const visitedCheckpoints = shift.patrolLogs.length;
      const missedCheckpoints = totalCheckpoints - visitedCheckpoints;

      return {
        shiftId: shift.id,
        guard: shift.guard,
        site: shift.site,
        startTime: shift.startTime,
        totalCheckpoints,
        visitedCheckpoints,
        missedCheckpoints,
        alertType: missedCheckpoints > 0 ? 'MISSED_CHECKPOINTS' : 'INACTIVE',
        severity: missedCheckpoints > totalCheckpoints / 2 ? 'HIGH' : 'MEDIUM'
      };
    }).filter(alert => alert.missedCheckpoints > 0);

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllShifts = async (req, res) => {
  try {
    const { status, siteId, startDate, endDate, limit = 50 } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (siteId) {
      whereClause.siteId = siteId;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate);
      }
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        guard: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        site: true,
        patrolLogs: {
          include: {
            checkpoint: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: parseInt(limit)
    });

    res.json(shifts);
  } catch (error) {
    console.error('Get all shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getGuardsOnDuty = async (req, res) => {
  try {
    const guards = await prisma.user.findMany({
      where: {
        role: 'GUARD',
        shifts: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        shifts: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            site: true,
            patrolLogs: {
              orderBy: {
                timestamp: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    res.json(guards);
  } catch (error) {
    console.error('Get guards on duty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPatrolTimeline = async (req, res) => {
  try {
    const { guardId, shiftId } = req.query;

    if (!guardId && !shiftId) {
      return res.status(400).json({ error: 'Guard ID or Shift ID is required' });
    }

    const whereClause = {};
    
    if (guardId) {
      whereClause.guardId = guardId;
    }
    
    if (shiftId) {
      whereClause.shiftId = shiftId;
    }

    const patrolLogs = await prisma.patrolLog.findMany({
      where: whereClause,
      include: {
        checkpoint: true,
        guard: {
          select: {
            id: true,
            name: true
          }
        },
        shift: {
          include: {
            site: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    res.json(patrolLogs);
  } catch (error) {
    console.error('Get patrol timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getLivePatrols,
  getAlerts,
  getAllShifts,
  getGuardsOnDuty,
  getPatrolTimeline
};
