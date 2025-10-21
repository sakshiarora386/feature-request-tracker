# Feature Request API

A RESTful API for managing feature requests.

## Features

- Create new feature requests
- Update request status
- View all requests
- View specific request details
- Delete requests

## API Endpoints

- `POST /api/feature-requests` - Create a new feature request
- `GET /api/feature-requests` - Get all feature requests
- `GET /api/feature-requests/:id` - Get a specific feature request
- `PUT /api/feature-requests/:id/status` - Update a feature request status
- `DELETE /api/feature-requests/:id` - Delete a feature request

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start the server: `npm start`

## Development

- Run in development mode: `npm run dev`
- Run tests: `npm test`

## Implementation Details

This project implements the feature request API as described in [Issue #1](https://github.com/sakshiarora386/demo-test/issues/1).

### POST /api/feature-requests

Creates a new feature request with the following fields:
- `title` (required): The title of the feature request
- `description` (optional): A detailed description of the feature request

The API automatically generates:
- A unique ID for the feature request
- Creation timestamp
- User information (currently hardcoded, would be from authentication in production)
- Initial status (NEW)

### Validation

The API validates:
- Title is required and must be a string
- Description is optional but must be a string if provided

### Error Handling

The API provides appropriate error responses:
- 400 Bad Request for validation errors
- 500 Internal Server Error for server-side issues

### Database Schema

The database schema includes:
- FeatureRequest model with fields for title, description, status, timestamps, and user info
- StatusChange model to track status changes over time