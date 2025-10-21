const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');

// Import custom middleware
const { validate, schemas } = require('./middleware/validation');
const { getCurrentUser } = require('./middleware/auth');
const { errorHandler, ApiError } = require('./middleware/error-handler');
const { logger, loggerMiddleware } = require('./middleware/logger');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);
app.use(getCurrentUser); // Add authentication middleware

// API Routes

// Create a new feature request
app.post(
  '/api/feature-requests',
  validate(schemas.createFeatureRequest),
  asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    const newFeatureRequest = await prisma.featureRequest.create({
      data: {
        title,
        description,
        createdBy: req.user.id, // Use authenticated user's ID
      },
    });
    
    logger.info('Feature request created', { id: newFeatureRequest.id });
    res.status(201).json(newFeatureRequest);
  })
);

// Get all feature requests
app.get(
  '/api/feature-requests',
  validate(schemas.getFeatureRequests),
  asyncHandler(async (req, res) => {
    const { sort_by, sort_order } = req.query;
    
    let orderBy = {};
    if (sort_by) {
      orderBy[sort_by] = sort_order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy = { createdAt: 'desc' };
    }
    
    const featureRequests = await prisma.featureRequest.findMany({
      orderBy,
      include: {
        statusHistory: true,
      },
    });
    
    logger.info('Feature requests retrieved', { count: featureRequests.length });
    res.status(200).json(featureRequests);
  })
);

// Get a specific feature request by ID
app.get(
  '/api/feature-requests/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const featureRequest = await prisma.featureRequest.findUnique({
      where: { id },
      include: {
        statusHistory: true,
      },
    });
    
    if (!featureRequest) {
      throw new ApiError('RESOURCE_NOT_FOUND', 'Feature request not found', 404);
    }
    
    logger.info('Feature request retrieved', { id });
    res.status(200).json(featureRequest);
  })
);

// Update the status of a feature request
app.put(
  '/api/feature-requests/:id/status',
  validate(schemas.updateFeatureRequestStatus),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if the feature request exists
    const existingFeatureRequest = await prisma.featureRequest.findUnique({
      where: { id },
    });
    
    if (!existingFeatureRequest) {
      throw new ApiError('RESOURCE_NOT_FOUND', 'Feature request not found', 404);
    }
    
    // Update the feature request and create a status change record
    const updatedFeatureRequest = await prisma.featureRequest.update({
      where: { id },
      data: {
        status,
        statusHistory: {
          create: {
            oldStatus: existingFeatureRequest.status,
            newStatus: status,
            changedBy: req.user.id, // Use authenticated user's ID
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });
    
    logger.info('Feature request status updated', { 
      id, 
      oldStatus: existingFeatureRequest.status, 
      newStatus: status 
    });
    
    res.status(200).json(updatedFeatureRequest);
  })
);

// Delete a feature request
app.delete(
  '/api/feature-requests/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if the feature request exists
    const existingFeatureRequest = await prisma.featureRequest.findUnique({
      where: { id },
    });
    
    if (!existingFeatureRequest) {
      throw new ApiError('RESOURCE_NOT_FOUND', 'Feature request not found', 404);
    }
    
    // Delete the feature request and its status history
    await prisma.$transaction([
      prisma.statusChange.deleteMany({
        where: { featureRequestId: id },
      }),
      prisma.featureRequest.delete({
        where: { id },
      }),
    ]);
    
    logger.info('Feature request deleted', { id });
    res.status(204).send();
  })
);

// Error handler middleware (must be after all routes)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { 
    reason: reason instanceof Error ? reason.stack : reason,
  });
  process.exit(1);
});