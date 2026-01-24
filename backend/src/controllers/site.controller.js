const prisma = require('../config/db');

const getAllSites = async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      include: {
        checkpoints: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(sites);
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSiteById = async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        checkpoints: true
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json(site);
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllSites,
  getSiteById
};
