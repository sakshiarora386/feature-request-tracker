const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Feature Request Tracker API',
      version: '1.0.0',
      description: 'API documentation for the Feature Request Tracker',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        FeatureRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the feature request',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            title: {
              type: 'string',
              description: 'Title of the feature request',
              example: 'Add dark mode support',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Detailed description of the feature request',
              example: 'Implement dark mode for better user experience in low-light environments',
            },
            status: {
              type: 'string',
              enum: ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
              description: 'Current status of the feature request',
              example: 'NEW',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the feature request was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the feature request was last updated',
            },
            createdBy: {
              type: 'string',
              description: 'ID of the user who created the feature request',
              example: 'user-123',
            },
            statusHistory: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/StatusChange',
              },
              description: 'History of status changes for the feature request',
            },
          },
        },
        StatusChange: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the status change',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            featureRequestId: {
              type: 'string',
              description: 'ID of the feature request this status change belongs to',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            oldStatus: {
              type: 'string',
              enum: ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
              description: 'Previous status of the feature request',
              example: 'NEW',
            },
            newStatus: {
              type: 'string',
              enum: ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
              description: 'New status of the feature request',
              example: 'IN_PROGRESS',
            },
            changedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the status was changed',
            },
            changedBy: {
              type: 'string',
              description: 'ID of the user who changed the status',
              example: 'user-123',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Error code',
              example: 'VALIDATION_ERROR',
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field that caused the error',
                    example: 'title',
                  },
                  message: {
                    type: 'string',
                    description: 'Error message for the field',
                    example: 'Title is required',
                  },
                },
              },
              description: 'Additional error details',
            },
          },
        },
      },
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication',
        },
      },
    },
    security: [
      {
        apiKey: [],
      },
    ],
  },
  apis: ['./server.js'], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Function to setup Swagger UI
const swaggerDocs = (app, port) => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
};

module.exports = { swaggerDocs };