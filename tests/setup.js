const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a test database URL
const TEST_DATABASE_URL = 'file:./test.db';

// Create a Prisma client for tests
const prisma = new PrismaClient({
  datasourceUrl: TEST_DATABASE_URL,
});

// Function to set up the test database
async function setupTestDatabase() {
  try {
    // Create a temporary .env file for tests
    const envPath = path.join(__dirname, '..', '.env.test');
    fs.writeFileSync(envPath, `DATABASE_URL=${TEST_DATABASE_URL}`);

    // Run Prisma migrations on the test database
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'inherit',
    });

    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

// Function to clean up the test database
async function cleanupTestDatabase() {
  try {
    // Delete all data from the test database
    await prisma.$transaction([
      prisma.statusChange.deleteMany({}),
      prisma.featureRequest.deleteMany({}),
    ]);
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}

// Function to close the Prisma client
async function closePrismaClient() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  setupTestDatabase,
  cleanupTestDatabase,
  closePrismaClient,
};