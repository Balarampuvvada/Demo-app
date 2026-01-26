const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser(email, password, name, role) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role // GUARD or SUPERVISOR
      }
    });

    console.log('✅ User created successfully:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    
    return user;
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: node scripts/create-user.js
// Or call the function directly with parameters

// Example usage (uncomment to use):
// const email = process.argv[2];
// const password = process.argv[3];
// const name = process.argv[4];
// const role = process.argv[5];

// if (!email || !password || !name || !role) {
//   console.log('Usage: node scripts/create-user.js <email> <password> <name> <role>');
//   console.log('Role must be: GUARD or SUPERVISOR');
//   process.exit(1);
// }

// createUser(email, password, name, role);

module.exports = { createUser };
