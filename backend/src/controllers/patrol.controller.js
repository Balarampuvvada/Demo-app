const prisma = require('../config/db');

const startShift = async (req, res) => {
  try {
    const { siteId, latitude, longitude } = req.body;
    const guardId = req.user.id;

    if (!siteId) {
      return res.status(400).json({ error: 'Site ID is required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'GPS location is required to start shift' });
    }

    // Check if guard already has an active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        guardId,
        status: 'ACTIVE'
      }
    });

    if (activeShift) {
      return res.status(400).json({ error: 'Guard already has an active shift' });
    }

    const shift = await prisma.shift.create({
      data: {
        guardId,
        siteId,
        status: 'ACTIVE',
        startLatitude: latitude,
        startLongitude: longitude
      },
      include: {
        site: true,
        guard: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(shift);
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const endShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { latitude, longitude } = req.body;
    const guardId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'GPS location is required to end shift' });
    }

    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        guardId,
        status: 'ACTIVE'
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Active shift not found' });
    }

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        endTime: new Date(),
        status: 'COMPLETED',
        endLatitude: latitude,
        endLongitude: longitude
      },
      include: {
        site: true,
        patrolLogs: {
          include: {
            checkpoint: true
          }
        }
      }
    });

    res.json(updatedShift);
  } catch (error) {
    console.error('End shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const logCheckpoint = async (req, res) => {
  try {
    const { shiftId, checkpointId, qrCode, latitude, longitude, notes } = req.body;
    const guardId = req.user.id;

    if (!shiftId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Shift ID, latitude, and longitude are required' });
    }

    // Verify shift is active
    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        guardId,
        status: 'ACTIVE'
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Active shift not found' });
    }

    // Find checkpoint by QR code or ID
    let checkpoint;
    if (qrCode) {
      checkpoint = await prisma.checkpoint.findUnique({
        where: { qrCode }
      });
    } else if (checkpointId) {
      checkpoint = await prisma.checkpoint.findUnique({
        where: { id: checkpointId }
      });
    }

    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }

    const patrolLog = await prisma.patrolLog.create({
      data: {
        shiftId,
        guardId,
        checkpointId: checkpoint.id,
        latitude,
        longitude,
        notes
      },
      include: {
        checkpoint: true,
        guard: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(patrolLog);
  } catch (error) {
    console.error('Log checkpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getShiftDetails = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = { id: shiftId };
    
    // Guards can only see their own shifts
    if (userRole === 'GUARD') {
      whereClause.guardId = userId;
    }

    const shift = await prisma.shift.findFirst({
      where: whereClause,
      include: {
        site: {
          include: {
            checkpoints: true
          }
        },
        guard: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        patrolLogs: {
          include: {
            checkpoint: true
          },
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(shift);
  } catch (error) {
    console.error('Get shift details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getActiveShift = async (req, res) => {
  try {
    const guardId = req.user.id;

    const shift = await prisma.shift.findFirst({
      where: {
        guardId,
        status: 'ACTIVE'
      },
      include: {
        site: {
          include: {
            checkpoints: true
          }
        },
        patrolLogs: {
          include: {
            checkpoint: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'No active shift found' });
    }

    res.json(shift);
  } catch (error) {
    console.error('Get active shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPatrolHistory = async (req, res) => {
  try {
    const guardId = req.user.id;
    const { limit = 10 } = req.query;

    const shifts = await prisma.shift.findMany({
      where: {
        guardId
      },
      include: {
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
    console.error('Get patrol history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  startShift,
  endShift,
  logCheckpoint,
  getShiftDetails,
  getActiveShift,
  getPatrolHistory
};
