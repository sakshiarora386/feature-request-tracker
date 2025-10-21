/**
 * Custom API Error class
 * Extends the built-in Error class to include additional properties
 * for API error responses
 */
class ApiError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Error handler middleware
 * Catches all errors and formats them into a standardized response
 */
const errorHandler = (err, req, res, next) => {
  // Log the error (will be replaced with structured logging)
  console.error(err);

  // Default error response
  let errorResponse = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  };

  // Set status code
  let statusCode = 500;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorResponse.code = err.code;
    errorResponse.message = err.message;
    
    // Add details if available
    if (err.details) {
      errorResponse.details = err.details;
    }
  } 
  // Handle Prisma errors
  else if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    errorResponse.code = 'DATABASE_ERROR';
    errorResponse.message = 'A database error occurred';
    errorResponse.details = err.message;
  }
  // Handle other known error types
  else if (err.name === 'SyntaxError') {
    statusCode = 400;
    errorResponse.code = 'INVALID_JSON';
    errorResponse.message = 'Invalid JSON in request body';
  }

  // Send the error response
  res.status(statusCode).json(errorResponse);
};

// Function to create and throw API errors
const throwApiError = (code, message, statusCode = 500, details = null) => {
  throw new ApiError(code, message, statusCode, details);
};

module.exports = {
  ApiError,
  errorHandler,
  throwApiError,
};