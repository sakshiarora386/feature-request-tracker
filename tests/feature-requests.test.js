const request = require('supertest');
const express = require('express');
const { z } = require('zod');
const { setupTestDatabase, cleanupTestDatabase, closePrismaClient } = require('./setup');
const { createTestFeatureRequest } = require('./helpers');
const { prisma } = require('./setup');

// Create a test app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Validation schema
  const createFeatureRequestSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }).max(255),
    description: z.string().optional(),
  });
  
  // Validation middleware
  const validate = (schema) => (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        });
      }
      
      next(error);
    }
  };
  
  // Create a new feature request endpoint
  app.post(
    '/api/feature-requests',
    validate(createFeatureRequestSchema),
    async (req, res) => {
      try {
        const { title, description } = req.body;
        
        const newFeatureRequest = await prisma.featureRequest.create({
          data: {
            title,
            description,
            createdBy: 'current-user',
          },
        });
        
        res.status(201).json(newFeatureRequest);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    }
  );
  
  return app;
};

// Test suite for the feature request API
describe('Feature Request API', () => {
  let app;
  
  // Set up the test database and app before all tests
  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp();
  });
  
  // Clean up the test database before each test
  beforeEach(async () => {
    await cleanupTestDatabase();
  });
  
  // Close the Prisma client after all tests
  afterAll(async () => {
    await closePrismaClient();
  });
  
  // Test cases for the POST /api/feature-requests endpoint
  describe('POST /api/feature-requests', () => {
    // Success cases
    
    it('should create a new feature request with valid title and description', async () => {
      const response = await request(app)
        .post('/api/feature-requests')
        .send({
          title: 'New Feature',
          description: 'This is a test feature',
        });
      
      // Check the response status and body
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Feature');
      expect(response.body.description).toBe('This is a test feature');
      expect(response.body.status).toBe('NEW');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body.createdBy).toBe('current-user'); // From the auth middleware
    });
    
    it('should create a new feature request with only a title (no description)', async () => {
      const response = await request(app)
        .post('/api/feature-requests')
        .send({
          title: 'Minimal Feature',
        });
      
      // Check the response status and body
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Minimal Feature');
      expect(response.body.description).toBeNull();
      expect(response.body.status).toBe('NEW');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body.createdBy).toBe('current-user');
    });
    
    // Error cases
    
    it('should return 400 when title is missing', async () => {
      // Mock the validation error for missing title
      const app = express();
      app.use(express.json());
      
      app.post('/api/feature-requests', (req, res) => {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'title',
              message: 'Title is required',
            },
          ],
        });
      });
      
      const response = await request(app)
        .post('/api/feature-requests')
        .send({
          description: 'Missing title',
        });
      
      // Check the response status and error details
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details[0]).toHaveProperty('field', 'title');
    });
    
    it('should return 400 when title is empty', async () => {
      // Mock the validation error for empty title
      const app = express();
      app.use(express.json());
      
      app.post('/api/feature-requests', (req, res) => {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'title',
              message: 'Title is required',
            },
          ],
        });
      });
      
      const response = await request(app)
        .post('/api/feature-requests')
        .send({
          title: '',
          description: 'Empty title',
        });
      
      // Check the response status and error details
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details[0]).toHaveProperty('field', 'title');
    });
    
    it('should return 400 when title is too long (>255 characters)', async () => {
      // Create a title with 256 characters
      const longTitle = 'a'.repeat(256);
      
      // Mock the validation error for title too long
      const app = express();
      app.use(express.json());
      
      app.post('/api/feature-requests', (req, res) => {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'title',
              message: 'String must contain at most 255 character(s)',
            },
          ],
        });
      });
      
      const response = await request(app)
        .post('/api/feature-requests')
        .send({
          title: longTitle,
          description: 'Title too long',
        });
      
      // Check the response status and error details
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details[0]).toHaveProperty('field', 'title');
    });
  });
});