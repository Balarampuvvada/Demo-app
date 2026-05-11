const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if database has existing demo data
  const existingUsers = await prisma.user.count();
  const existingSites = await prisma.site.count();

  // If sites exist but no users, we need to clear the database first
  if (existingSites > 0 && existingUsers === 0) {
    console.log('⚠️  Sites already exist but no users. Clearing existing data...');
    await prisma.patrolLog.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.checkpoint.deleteMany({});
    await prisma.site.deleteMany({});
  }

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const guard1 = await prisma.user.upsert({
    where: { email: 'guard1@security.com' },
    update: { password: hashedPassword, name: 'John Smith', role: 'GUARD' },
    create: {
      email: 'guard1@security.com',
      password: hashedPassword,
      name: 'John Smith',
      role: 'GUARD'
    }
  });

  const guard2 = await prisma.user.upsert({
    where: { email: 'guard2@security.com' },
    update: { password: hashedPassword, name: 'Sarah Johnson', role: 'GUARD' },
    create: {
      email: 'guard2@security.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      role: 'GUARD'
    }
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@security.com' },
    update: { password: hashedPassword, name: 'Mike Wilson', role: 'SUPERVISOR' },
    create: {
      email: 'supervisor@security.com',
      password: hashedPassword,
      name: 'Mike Wilson',
      role: 'SUPERVISOR'
    }
  });



  const site1 = await prisma.site.upsert({
  where: {
  id: 1
  },
  update: {},
  create: {
  id: 1,
  name: 'Downtown Office Complex',
  address: '123 Main Street, Downtown',
  latitude: 40.7128,
  longitude: -74.0060
  }
  });

  const site2 = await prisma.site.upsert({
    where: { name: 'Warehouse District A' },
    update: {},
    create: {
      name: 'Warehouse District A',
      address: '456 Industrial Ave',
      latitude: 40.7580,
      longitude: -73.9855
    }
  });

  console.log('✅ Sites created');

  // Create checkpoints for site1
  const checkpoints1 = await Promise.all([
    prisma.checkpoint.upsert({
      where: { qrCode: 'SITE1-CHECKPOINT-001' },
      update: {},
      create: {
        siteId: site1.id,
        name: 'Main Entrance',
        qrCode: 'SITE1-CHECKPOINT-001',
        latitude: 40.7128,
        longitude: -74.0060
      }
    }),
    prisma.checkpoint.upsert({
      where: { qrCode: 'SITE1-CHECKPOINT-002' },
      update: {},
      create: {
        siteId: site1.id,
        name: 'North Wing Corridor',
        qrCode: 'SITE1-CHECKPOINT-002',
        latitude: 40.7130,
        longitude: -74.0058
      }
    }),
    prisma.checkpoint.upsert({
      where: { qrCode: 'SITE1-CHECKPOINT-003' },
      update: {},
      create: {
        siteId: site1.id,
        name: 'Parking Lot',
        qrCode: 'SITE1-CHECKPOINT-003',
        latitude: 40.7126,
        longitude: -74.0062
      }
    }),
    prisma.checkpoint.upsert({
      where: { qrCode: 'SITE1-CHECKPOINT-004' },
      update: {},
      create: {
        siteId: site1.id,
        name: 'Emergency Exit',
        qrCode: 'SITE1-CHECKPOINT-004',
        latitude: 40.7125,
        longitude: -74.0059
      }
    })
  ]);

  // Create checkpoints for site2
  const checkpoints2 = await Promise.all([
    prisma.checkpoint.upsert({
      where: { qrCode: 'SITE2-CHECKPOINT-001' },
      update: {},
      create: {
        siteId: site2.id,
        name: 'Warehouse Main Gate',
        qrCode: 'SITE2-CHECKPOINT-001',
        latitude: 40.7580,
        longitude: -73.9855
      }
    }),
    prisma.checkpoint.upsert({
      where: { qrCode: 'SITE2-CHECKPOINT-002' },
      update: {},
      create: {
        siteId: site2.id,
        name: 'Loading Dock',
        qrCode: 'SITE2-CHECKPOINT-002',
        latitude: 40.7582,
        longitude: -73.9853
      }
    }),
    prisma.checkpoint.upsert({
      where: { qrCode: 'SITE2-CHECKPOINT-003' },
      update: {},
      create: {
        siteId: site2.id,
        name: 'Storage Area',
        qrCode: 'SITE2-CHECKPOINT-003',
        latitude: 40.7578,
        longitude: -73.9857
      }
    })
  ]);

  console.log('✅ Checkpoints created');

  // Create one sample completed shift if the demo guard/site does not have one yet.
  let pastShift = await prisma.shift.findFirst({
    where: {
      guardId: guard1.id,
      siteId: site1.id,
      status: 'COMPLETED'
    }
  });

  if (!pastShift) {
    pastShift = await prisma.shift.create({
      data: {
        guardId: guard1.id,
        siteId: site1.id,
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        status: 'COMPLETED'
      }
    });
  }

  // Check if patrol logs already exist for this shift
  const existingLogs = await prisma.patrolLog.count({
    where: { shiftId: pastShift.id }
  });

  if (existingLogs === 0) {
    // Create patrol logs for the completed shift
    await Promise.all([
      prisma.patrolLog.create({
        data: {
          shiftId: pastShift.id,
          guardId: guard1.id,
          checkpointId: checkpoints1[0].id,
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          latitude: 40.7128,
          longitude: -74.0060
        }
      }),
      prisma.patrolLog.create({
        data: {
          shiftId: pastShift.id,
          guardId: guard1.id,
          checkpointId: checkpoints1[1].id,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          latitude: 40.7130,
          longitude: -74.0058
        }
      }),
      prisma.patrolLog.create({
        data: {
          shiftId: pastShift.id,
          guardId: guard1.id,
          checkpointId: checkpoints1[2].id,
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          latitude: 40.7126,
          longitude: -74.0062
        }
      })
    ]);
    console.log('✅ Sample patrol logs created');
  } else {
    console.log('✅ Sample patrol logs already exist');
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('-------------------');
  console.log('Guard 1:');
  console.log('  Email: guard1@security.com');
  console.log('  Password: password123');
  console.log('\nGuard 2:');
  console.log('  Email: guard2@security.com');
  console.log('  Password: password123');
  console.log('\nSupervisor:');
  console.log('  Email: supervisor@security.com');
  console.log('  Password: password123');

  console.log('-------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
