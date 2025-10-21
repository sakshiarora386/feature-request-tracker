// This is a simple setup script to demonstrate how to use the Prisma client
const { PrismaClient } = require('@prisma/client');
const { logger } = require('./middleware/logger');

const prisma = new PrismaClient();

// Placeholder for authenticated user ID
// In a real application, this would come from an authentication system
const CURRENT_USER_ID = 'current-user';

async function main() {
  try {
    logger.info('Setting up the database...');

    // Create a new feature request
    const newFeatureRequest = await prisma.featureRequest.create({
      data: {
        title: 'Add dark mode support',
        description: 'Implement dark mode for better user experience in low-light environments',
        createdBy: CURRENT_USER_ID, // Use the placeholder user ID
      },
    });
    logger.info('Created new feature request', { featureRequest: newFeatureRequest });

    // Update the status of the feature request
    const updatedFeatureRequest = await prisma.featureRequest.update({
      where: { id: newFeatureRequest.id },
      data: {
        status: 'IN_PROGRESS',
        statusHistory: {
          create: {
            oldStatus: 'NEW',
            newStatus: 'IN_PROGRESS',
            changedBy: CURRENT_USER_ID, // Use the placeholder user ID
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });
    logger.info('Updated feature request', { 
      id: updatedFeatureRequest.id,
      status: updatedFeatureRequest.status
    });

    // Get all feature requests
    const allFeatureRequests = await prisma.featureRequest.findMany({
      include: {
        statusHistory: true,
      },
    });
    logger.info('All feature requests', { 
      count: allFeatureRequests.length,
      requests: allFeatureRequests
    });

    logger.info('Database setup completed successfully!');
  } catch (error) {
    logger.error('Error setting up the database', { 
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();