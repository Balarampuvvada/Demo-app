const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate unique QR code for checkpoint
const generateUniqueQRCode = (siteName, checkpointNumber) => {
  const sitePrefix = siteName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .substring(0, 15);
  const uniqueId = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${sitePrefix}-CP${String(checkpointNumber).padStart(3, '0')}-${uniqueId}`;
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['GUARD', 'SUPERVISOR', 'CLIENT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new site with checkpoints
const createSite = async (req, res) => {
  try {
    const { name, address, latitude, longitude, checkpoints } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Site name is required' });
    }

    if (!checkpoints || !Array.isArray(checkpoints) || checkpoints.length === 0) {
      return res.status(400).json({ error: 'At least one checkpoint is required' });
    }

    // Validate checkpoint data
    for (const cp of checkpoints) {
      if (!cp.name || cp.latitude === undefined || cp.longitude === undefined) {
        return res.status(400).json({ 
          error: 'Each checkpoint must have name, latitude, and longitude' 
        });
      }
    }

    // Generate unique QR codes for each checkpoint
    const checkpointsWithQR = checkpoints.map((cp, index) => ({
      name: cp.name,
      qrCode: generateUniqueQRCode(name, index + 1),
      latitude: cp.latitude,
      longitude: cp.longitude
    }));

    const site = await prisma.site.create({
      data: {
        name,
        address: address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        checkpoints: {
          create: checkpointsWithQR
        }
      },
      include: {
        checkpoints: true
      }
    });

    res.status(201).json({
      message: 'Site created successfully',
      site: {
        ...site,
        checkpoints: site.checkpoints.map(cp => ({
          id: cp.id,
          name: cp.name,
          qrCode: cp.qrCode,
          latitude: cp.latitude,
          longitude: cp.longitude
        }))
      }
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Update site
const updateSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { name, address, latitude, longitude } = req.body;

    const site = await prisma.site.update({
      where: { id: siteId },
      data: {
        name,
        address,
        latitude,
        longitude
      },
      include: {
        checkpoints: true
      }
    });

    res.json({
      message: 'Site updated successfully',
      site
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
};

// Add checkpoint to existing site
const addCheckpoint = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { name, latitude, longitude } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        error: 'Name, latitude, and longitude are required' 
      });
    }

    // Get site info for QR code generation
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        checkpoints: true
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Generate unique QR code
    const checkpointNumber = site.checkpoints.length + 1;
    const qrCode = generateUniqueQRCode(site.name, checkpointNumber);

    const checkpoint = await prisma.checkpoint.create({
      data: {
        siteId,
        name,
        qrCode,
        latitude,
        longitude
      }
    });

    res.status(201).json({
      message: 'Checkpoint added successfully',
      checkpoint
    });
  } catch (error) {
    console.error('Add checkpoint error:', error);
    res.status(500).json({ error: 'Failed to add checkpoint' });
  }
};

// Delete checkpoint
const deleteCheckpoint = async (req, res) => {
  try {
    const { checkpointId } = req.params;

    await prisma.checkpoint.delete({
      where: { id: checkpointId }
    });

    res.json({ message: 'Checkpoint deleted successfully' });
  } catch (error) {
    console.error('Delete checkpoint error:', error);
    res.status(500).json({ error: 'Failed to delete checkpoint' });
  }
};

// Delete site
const deleteSite = async (req, res) => {
  try {
    const { siteId } = req.params;

    await prisma.site.delete({
      where: { id: siteId }
    });

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
};

module.exports = {
  createUser,
  createSite,
  getAllUsers,
  deleteUser,
  updateSite,
  addCheckpoint,
  deleteCheckpoint,
  deleteSite
};
