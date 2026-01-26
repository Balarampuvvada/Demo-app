const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
  console.log('\n👤 CREATE NEW USER');
  console.log('==================\n');
  
  const email = await question('Email: ');
  const password = await question('Password: ');
  const name = await question('Full Name: ');
  
  console.log('\nSelect Role:');
  console.log('1. GUARD');
  console.log('2. SUPERVISOR');

  const roleChoice = await question('Choice (1-2): ');
  
  const roles = { '1': 'GUARD', '2': 'SUPERVISOR' };
  const role = roles[roleChoice];
  
  if (!role) {
    console.log('❌ Invalid role selection');
    return;
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role }
    });
    
    console.log('\n✅ User created successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}\n`);
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
  }
}

async function createSite() {
  console.log('\n🏢 CREATE NEW SITE');
  console.log('==================\n');
  
  const name = await question('Site Name: ');
  const address = await question('Address: ');
  const latitude = parseFloat(await question('Latitude: '));
  const longitude = parseFloat(await question('Longitude: '));
  
  const checkpointsCount = parseInt(await question('Number of checkpoints: '));
  const checkpoints = [];
  
  for (let i = 1; i <= checkpointsCount; i++) {
    console.log(`\n📍 Checkpoint ${i}:`);
    const cpName = await question('  Name: ');
    const cpQrCode = await question('  QR Code: ');
    const cpLat = parseFloat(await question('  Latitude: '));
    const cpLng = parseFloat(await question('  Longitude: '));
    
    checkpoints.push({
      name: cpName,
      qrCode: cpQrCode,
      latitude: cpLat,
      longitude: cpLng
    });
  }
  
  try {
    const site = await prisma.site.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        checkpoints: {
          create: checkpoints
        }
      },
      include: { checkpoints: true }
    });
    
    console.log('\n✅ Site created successfully!');
    console.log(`   ID: ${site.id}`);
    console.log(`   Name: ${site.name}`);
    console.log(`   Checkpoints: ${site.checkpoints.length}`);
    console.log('\n📋 QR Codes to Generate:');
    site.checkpoints.forEach(cp => {
      console.log(`   - ${cp.name}: ${cp.qrCode}`);
    });
    console.log('\nGenerate these QR codes at: https://www.qr-code-generator.com/\n');
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
  }
}

async function listUsers() {
  console.log('\n👥 ALL USERS');
  console.log('============\n');
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  
  console.log(`Found ${users.length} users:\n`);
  users.forEach(user => {
    console.log(`${user.role.padEnd(11)} | ${user.name.padEnd(25)} | ${user.email}`);
  });
  console.log('');
}

async function listSites() {
  console.log('\n🏢 ALL SITES AND CHECKPOINTS');
  console.log('============================\n');
  
  const sites = await prisma.site.findMany({
    include: { checkpoints: true }
  });
  
  console.log(`Found ${sites.length} sites:\n`);
  sites.forEach(site => {
    console.log(`📍 ${site.name}`);
    console.log(`   ID: ${site.id}`);
    console.log(`   Address: ${site.address || 'N/A'}`);
    console.log(`   Checkpoints: ${site.checkpoints.length}`);
    site.checkpoints.forEach(cp => {
      console.log(`      - ${cp.name}: ${cp.qrCode}`);
    });
    console.log('');
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Security Patrol - Admin Management Tool  ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  while (true) {
    console.log('Select an option:');
    console.log('1. Create User');
    console.log('2. Create Site with Checkpoints');
    console.log('3. List All Users');
    console.log('4. List All Sites');
    console.log('5. Exit\n');
    
    const choice = await question('Your choice (1-5): ');
    
    switch (choice) {
      case '1':
        await createUser();
        break;
      case '2':
        await createSite();
        break;
      case '3':
        await listUsers();
        break;
      case '4':
        await listSites();
        break;
      case '5':
        console.log('\n👋 Goodbye!\n');
        rl.close();
        await prisma.$disconnect();
        process.exit(0);
      default:
        console.log('\n❌ Invalid choice\n');
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
