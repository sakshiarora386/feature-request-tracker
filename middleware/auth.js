/**
 * Authentication middleware for the Feature Request Tracker API
 * 
 * This implements a basic API key authentication system for the MVP.
 * In a production environment, this would be replaced with a more robust
 * authentication system like OAuth2 or JWT.
 */

const { ApiError } = require('./error-handler');
const { logger } = require('./logger');

// In a real application, API keys would be stored in a database
// For the MVP, we'll use a simple in-memory store with a default key
const API_KEYS = {
  'default-api-key': {
    id: 'current-user',
    role: 'admin', // For MVP, we'll have a single role
  },
};

// Environment variable override for the API key (if provided)
if (process.env.API_KEY) {
  API_KEYS[process.env.API_KEY] = {
    id: 'current-user',
    role: 'admin',
  };
}

/**
 * Middleware to authenticate requests using API key
 * The API key should be provided in the x-api-key header
 */
const authenticate = (req, res, next) => {
  // Get the API key from the request header
  const apiKey = req.header('x-api-key');
  
  // Check if the API key is provided
  if (!apiKey) {
    logger.warn('Authentication failed: No API key provided');
    throw new ApiError('AUTHENTICATION_REQUIRED', 'API key is required', 401);
  }
  
  // Check if the API key is valid
  const user = API_KEYS[apiKey];
  if (!user) {
    logger.warn('Authentication failed: Invalid API key', { apiKey });
    throw new ApiError('INVALID_CREDENTIALS', 'Invalid API key', 401);
  }
  
  // Attach the user to the request object
  req.user = user;
  
  logger.debug('User authenticated', { userId: user.id });
  next();
};

/**
 * Middleware to get the current authenticated user
 * This is a wrapper around the authenticate middleware that
 * makes authentication optional for development purposes
 */
const getCurrentUser = (req, res, next) => {
  // In development mode, we can skip authentication
  if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_AUTH) {
    // Use a default user for development
    req.user = {
      id: 'current-user',
      role: 'admin',
    };
    return next();
  }
  
  // In production or when authentication is required, use the authenticate middleware
  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  getCurrentUser,
};