const { z } = require('zod');

// Define validation schemas
const schemas = {
  // Schema for creating a feature request
  createFeatureRequest: z.object({
    title: z.string().min(1, { message: 'Title is required' }).max(255),
    description: z.string().optional(),
  }),

  // Schema for updating a feature request status
  updateFeatureRequestStatus: z.object({
    status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'], {
      message: 'Status must be one of: NEW, IN_PROGRESS, COMPLETED, REJECTED',
    }),
  }),

  // Schema for query parameters in get all feature requests
  getFeatureRequests: z.object({
    sort_by: z.enum(['createdAt', 'status']).optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
};

// Validation middleware factory
const validate = (schema) => (req, res, next) => {
  try {
    // Determine what to validate based on the request method
    let data;
    if (req.method === 'GET') {
      data = req.query;
    } else {
      data = req.body;
    }

    // Validate the data against the schema
    const validatedData = schema.parse(data);
    
    // Replace the request data with the validated data
    if (req.method === 'GET') {
      req.query = validatedData;
    } else {
      req.body = validatedData;
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod validation errors
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

module.exports = {
  validate,
  schemas,
};