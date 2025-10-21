// This is a simple setup script to demonstrate how to use the Prisma client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Setting up the database...');

    // Create a new feature request
    const newFeatureRequest = await prisma.featureRequest.create({
      data: {
        title: 'Add dark mode support',
        description: 'Implement dark mode for better user experience in low-light environments',
        createdBy: 'user123', // In a real app, this would be the authenticated user's ID
      },
    });
    console.log('Created new feature request:', newFeatureRequest);

    // Update the status of the feature request
    const updatedFeatureRequest = await prisma.featureRequest.update({
      where: { id: newFeatureRequest.id },
      data: {
        status: 'IN_PROGRESS',
        statusHistory: {
          create: {
            oldStatus: 'NEW',
            newStatus: 'IN_PROGRESS',
            changedBy: 'user456', // In a real app, this would be the authenticated user's ID
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });
    console.log('Updated feature request:', updatedFeatureRequest);

    // Get all feature requests
    const allFeatureRequests = await prisma.featureRequest.findMany({
      include: {
        statusHistory: true,
      },
    });
    console.log('All feature requests:', allFeatureRequests);

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();