const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// API Routes

// Create a new feature request
app.post('/api/feature-requests', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const newFeatureRequest = await prisma.featureRequest.create({
      data: {
        title,
        description,
        createdBy: 'user123', // In a real app, this would be the authenticated user's ID
      },
    });
    
    res.status(201).json(newFeatureRequest);
  } catch (error) {
    console.error('Error creating feature request:', error);
    res.status(500).json({ error: 'Failed to create feature request' });
  }
});

// Get all feature requests
app.get('/api/feature-requests', async (req, res) => {
  try {
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
    
    res.status(200).json(featureRequests);
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    res.status(500).json({ error: 'Failed to fetch feature requests' });
  }
});

// Get a specific feature request by ID
app.get('/api/feature-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const featureRequest = await prisma.featureRequest.findUnique({
      where: { id },
      include: {
        statusHistory: true,
      },
    });
    
    if (!featureRequest) {
      return res.status(404).json({ error: 'Feature request not found' });
    }
    
    res.status(200).json(featureRequest);
  } catch (error) {
    console.error('Error fetching feature request:', error);
    res.status(500).json({ error: 'Failed to fetch feature request' });
  }
});

// Update the status of a feature request
app.put('/api/feature-requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Check if the feature request exists
    const existingFeatureRequest = await prisma.featureRequest.findUnique({
      where: { id },
    });
    
    if (!existingFeatureRequest) {
      return res.status(404).json({ error: 'Feature request not found' });
    }
    
    // Validate the status
    const validStatuses = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
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
            changedBy: 'user456', // In a real app, this would be the authenticated user's ID
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });
    
    res.status(200).json(updatedFeatureRequest);
  } catch (error) {
    console.error('Error updating feature request status:', error);
    res.status(500).json({ error: 'Failed to update feature request status' });
  }
});

// Delete a feature request
app.delete('/api/feature-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the feature request exists
    const existingFeatureRequest = await prisma.featureRequest.findUnique({
      where: { id },
    });
    
    if (!existingFeatureRequest) {
      return res.status(404).json({ error: 'Feature request not found' });
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
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting feature request:', error);
    res.status(500).json({ error: 'Failed to delete feature request' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});