const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, cleanupTestDatabase, closePrismaClient } = require('./setup');
const { prisma } = require('./setup');
const { createTestFeatureRequest } = require('./helpers');

// Test suite for the feature request API
describe('Feature Request API', () => {
  // Set up the test database before all tests
  beforeAll(async () => {
    await setupTestDatabase();
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
      expect(response.body.createdBy).toBe('current-user');
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
    
    it('should return 400 when title is missing', async () => {
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
  });
  
  // Test cases for the GET /api/feature-requests endpoint
  describe('GET /api/feature-requests', () => {
    it('should return an empty array when no feature requests exist', async () => {
      const response = await request(app)
        .get('/api/feature-requests');
      
      // Check the response status and body
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
    
    it('should return all feature requests', async () => {
      // Create test feature requests
      await createTestFeatureRequest({ title: 'Feature 1' });
      await createTestFeatureRequest({ title: 'Feature 2' });
      
      const response = await request(app)
        .get('/api/feature-requests');
      
      // Check the response status and body
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[1]).toHaveProperty('title');
    });
    
    it('should sort feature requests by createdAt in ascending order', async () => {
      // Create test feature requests with a delay between them
      const feature1 = await createTestFeatureRequest({ title: 'Feature 1' });
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      const feature2 = await createTestFeatureRequest({ title: 'Feature 2' });
      
      const response = await request(app)
        .get('/api/feature-requests?sort_by=createdAt&sort_order=asc');
      
      // Check the response status and body
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].id).toBe(feature1.id);
      expect(response.body[1].id).toBe(feature2.id);
    });
    
    it('should sort feature requests by status', async () => {
      // Create test feature requests with different statuses
      const feature1 = await createTestFeatureRequest({ 
        title: 'Feature 1',
        status: 'COMPLETED'
      });
      const feature2 = await createTestFeatureRequest({ 
        title: 'Feature 2',
        status: 'NEW'
      });
      
      const response = await request(app)
        .get('/api/feature-requests?sort_by=status&sort_order=asc');
      
      // Check the response status and body
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].status).toBe('COMPLETED');
      expect(response.body[1].status).toBe('NEW');
    });
  });
  
  // Test cases for the GET /api/feature-requests/:id endpoint
  describe('GET /api/feature-requests/:id', () => {
    it('should return a specific feature request by ID', async () => {
      // Create a test feature request
      const feature = await createTestFeatureRequest({ 
        title: 'Test Feature',
        description: 'Test Description'
      });
      
      const response = await request(app)
        .get(`/api/feature-requests/${feature.id}`);
      
      // Check the response status and body
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', feature.id);
      expect(response.body).toHaveProperty('title', 'Test Feature');
      expect(response.body).toHaveProperty('description', 'Test Description');
      expect(response.body).toHaveProperty('status', 'NEW');
      expect(response.body).toHaveProperty('statusHistory');
      expect(Array.isArray(response.body.statusHistory)).toBe(true);
    });
    
    it('should return 404 when feature request does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      
      const response = await request(app)
        .get(`/api/feature-requests/${nonExistentId}`);
      
      // Check the response status and error details
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
      expect(response.body).toHaveProperty('message', 'Feature request not found');
    });
  });
  
  // Test cases for the PUT /api/feature-requests/:id/status endpoint
  describe('PUT /api/feature-requests/:id/status', () => {
    it('should update the status of a feature request', async () => {
      // Create a test feature request
      const feature = await createTestFeatureRequest({ 
        title: 'Status Test Feature'
      });
      
      const response = await request(app)
        .put(`/api/feature-requests/${feature.id}/status`)
        .send({
          status: 'IN_PROGRESS'
        });
      
      // Check the response status and body
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', feature.id);
      expect(response.body).toHaveProperty('status', 'IN_PROGRESS');
      expect(response.body).toHaveProperty('statusHistory');
      expect(Array.isArray(response.body.statusHistory)).toBe(true);
      expect(response.body.statusHistory.length).toBe(1);
      expect(response.body.statusHistory[0]).toHaveProperty('oldStatus', 'NEW');
      expect(response.body.statusHistory[0]).toHaveProperty('newStatus', 'IN_PROGRESS');
    });
    
    it('should return 400 when status is invalid', async () => {
      // Create a test feature request
      const feature = await createTestFeatureRequest({ 
        title: 'Invalid Status Test'
      });
      
      const response = await request(app)
        .put(`/api/feature-requests/${feature.id}/status`)
        .send({
          status: 'INVALID_STATUS'
        });
      
      // Check the response status and error details
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details[0]).toHaveProperty('field', 'status');
    });
    
    it('should return 404 when feature request does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      
      const response = await request(app)
        .put(`/api/feature-requests/${nonExistentId}/status`)
        .send({
          status: 'IN_PROGRESS'
        });
      
      // Check the response status and error details
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
      expect(response.body).toHaveProperty('message', 'Feature request not found');
    });
  });
  
  // Test cases for the DELETE /api/feature-requests/:id endpoint
  describe('DELETE /api/feature-requests/:id', () => {
    it('should delete a feature request', async () => {
      // Create a test feature request
      const feature = await createTestFeatureRequest({ 
        title: 'Delete Test Feature'
      });
      
      const response = await request(app)
        .delete(`/api/feature-requests/${feature.id}`);
      
      // Check the response status
      expect(response.status).toBe(204);
      
      // Verify the feature request was deleted
      const deletedFeature = await prisma.featureRequest.findUnique({
        where: { id: feature.id }
      });
      expect(deletedFeature).toBeNull();
    });
    
    it('should return 404 when feature request does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      
      const response = await request(app)
        .delete(`/api/feature-requests/${nonExistentId}`);
      
      // Check the response status and error details
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
      expect(response.body).toHaveProperty('message', 'Feature request not found');
    });
  });
});