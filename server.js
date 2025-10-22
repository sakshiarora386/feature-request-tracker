const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');

// Import custom middleware
const { validate, schemas } = require('./middleware/validation');
const { getCurrentUser } = require('./middleware/auth');
const { errorHandler, ApiError } = require('./middleware/error-handler');
const { logger, loggerMiddleware } = require('./middleware/logger');
const { swaggerDocs } = require('./swagger');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);
app.use(getCurrentUser); // Add authentication middleware

// API Routes

/**
 * @swagger
 * /api/feature-requests:
 *   post:
 *     summary: Create a new feature request
 *     description: Creates a new feature request with the provided title and optional description
 *     tags: [Feature Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the feature request
 *               description:
 *                 type: string
 *                 description: Detailed description of the feature request
 *     responses:
 *       201:
 *         description: Feature request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeatureRequest'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/feature-requests:
 *   get:
 *     summary: Get all feature requests
 *     description: Retrieves a list of all feature requests with optional sorting
 *     tags: [Feature Requests]
 *     parameters:
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [createdAt, status]
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: A list of feature requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FeatureRequest'
 */
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

/**
 * @swagger
 * /api/feature-requests/{id}:
 *   get:
 *     summary: Get a specific feature request
 *     description: Retrieves a specific feature request by its ID
 *     tags: [Feature Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the feature request to retrieve
 *     responses:
 *       200:
 *         description: Feature request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeatureRequest'
 *       404:
 *         description: Feature request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/feature-requests/{id}/status:
 *   put:
 *     summary: Update the status of a feature request
 *     description: Updates the status of a specific feature request and records the status change
 *     tags: [Feature Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the feature request to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [NEW, IN_PROGRESS, COMPLETED, REJECTED]
 *                 description: New status for the feature request
 *     responses:
 *       200:
 *         description: Feature request status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeatureRequest'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Feature request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/feature-requests/{id}:
 *   delete:
 *     summary: Delete a feature request
 *     description: Deletes a specific feature request and its status history
 *     tags: [Feature Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the feature request to delete
 *     responses:
 *       204:
 *         description: Feature request deleted successfully
 *       404:
 *         description: Feature request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// Only start the server if this file is run directly
if (require.main === module) {
  // Start the server
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    // Initialize Swagger docs
    swaggerDocs(app, PORT);
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
}

// Export the app for testing
module.exports = app;