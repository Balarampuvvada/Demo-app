const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSiteWithCheckpoints(siteName, address, latitude, longitude, checkpoints) {
  try {
    const site = await prisma.site.create({
      data: {
        name: siteName,
        address,
        latitude,
        longitude,
        checkpoints: {
          create: checkpoints.map(cp => ({
            name: cp.name,
            qrCode: cp.qrCode,
            latitude: cp.latitude,
            longitude: cp.longitude
          }))
        }
      },
      include: {
        checkpoints: true
      }
    });

    console.log('✅ Site created successfully:');
    console.log(`   Name: ${site.name}`);
    console.log(`   ID: ${site.id}`);
    console.log(`   Address: ${site.address || 'N/A'}`);
    console.log(`   Location: ${site.latitude}, ${site.longitude}`);
    console.log(`   Checkpoints: ${site.checkpoints.length}`);
    console.log('\n📍 Checkpoint QR Codes:');
    site.checkpoints.forEach(cp => {
      console.log(`   - ${cp.name}: ${cp.qrCode}`);
    });
    
    return site;
  } catch (error) {
    console.error('❌ Error creating site:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Example usage:
async function exampleUsage() {
  const site = await createSiteWithCheckpoints(
    'Shopping Mall Alpha',
    '789 Commerce Street',
    40.7589,
    -73.9851,
    [
      {
        name: 'Main Entrance Gate',
        qrCode: 'MALL-ALPHA-CHECKPOINT-001',
        latitude: 40.7589,
        longitude: -73.9851
      },
      {
        name: 'Food Court Area',
        qrCode: 'MALL-ALPHA-CHECKPOINT-002',
        latitude: 40.7590,
        longitude: -73.9849
      },
      {
        name: 'Parking Level B1',
        qrCode: 'MALL-ALPHA-CHECKPOINT-003',
        latitude: 40.7588,
        longitude: -73.9853
      }
    ]
  );
}

// Uncomment to run:
// exampleUsage();

module.exports = { createSiteWithCheckpoints };
