# Feature Request Tracker API

A RESTful API for managing feature requests, allowing teams to collect, track, and manage feature requests throughout their lifecycle.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Overview

The Feature Request Tracker API provides a centralized repository for all feature requests, enabling clear status tracking and improving transparency and communication around feature development.

## Features

- Create, read, update, and delete feature requests
- Track status changes of feature requests
- Sort and filter feature requests
- API documentation with Swagger/OpenAPI
- Basic API key authentication
- Comprehensive error handling
- Structured logging

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/feature-request-tracker.git
   cd feature-request-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. (Optional) Seed the database with sample data:
   ```bash
   npm run setup
   ```

5. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database connection string
DATABASE_URL="file:./dev.db"

# Node environment (development, production, test)
NODE_ENV=development

# Server port
PORT=3000

# Log level (error, warn, info, http, verbose, debug, silly)
LOG_LEVEL=info

# API Key for authentication (optional in development)
# API_KEY=your-api-key-here

# Set to true to require authentication even in development mode
# REQUIRE_AUTH=true
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running. It provides detailed information about all endpoints, request/response formats, and authentication requirements.

### Endpoints

- `POST /api/feature-requests` - Create a new feature request
- `GET /api/feature-requests` - Get all feature requests
- `GET /api/feature-requests/:id` - Get a specific feature request
- `PUT /api/feature-requests/:id/status` - Update the status of a feature request
- `DELETE /api/feature-requests/:id` - Delete a feature request

## Database Schema

The database schema consists of two main models:

### FeatureRequest

- `id` - Unique identifier (UUID)
- `title` - Title of the feature request
- `description` - Detailed description (optional)
- `status` - Current status (NEW, IN_PROGRESS, COMPLETED, REJECTED)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `createdBy` - ID of the user who created the request
- `statusHistory` - Relation to StatusChange records

### StatusChange

- `id` - Unique identifier (UUID)
- `featureRequestId` - ID of the related feature request
- `oldStatus` - Previous status
- `newStatus` - New status
- `changedAt` - Timestamp of the status change
- `changedBy` - ID of the user who changed the status

## Authentication

The API uses a simple API key authentication system for the MVP. To authenticate requests, include the API key in the `x-api-key` header:

```
x-api-key: your-api-key-here
```

In development mode, authentication is optional unless the `REQUIRE_AUTH` environment variable is set to `true`.

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Project Structure

```
feature-request-tracker/
├── docs/                  # Documentation
├── middleware/            # Express middleware
│   ├── auth.js            # Authentication middleware
│   ├── error-handler.js   # Error handling middleware
│   ├── logger.js          # Logging middleware
│   └── validation.js      # Request validation middleware
├── prisma/                # Prisma ORM
│   ├── migrations/        # Database migrations
│   └── schema.prisma      # Database schema
├── tests/                 # Test files
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore file
├── package.json           # Project dependencies and scripts
├── server.js              # Express server setup
├── setup.js               # Database setup script
└── swagger.js             # Swagger/OpenAPI configuration