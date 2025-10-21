# Feature Request Tracker - Database Schema and Prisma Setup

This repository contains the implementation of the database schema and Prisma setup for the Feature Request Tracker application as described in GitHub issue #5.

## Setup Details

### Database Configuration
- SQLite database is used for data storage
- Prisma ORM is configured to interact with the database
- Database schema includes models for FeatureRequest and StatusChange

### Models Implemented
1. **FeatureRequest**
   - Properties: id, title, description, status, createdAt, updatedAt, createdBy
   - Relations: One-to-many with StatusChange

2. **StatusChange**
   - Properties: id, featureRequestId, oldStatus, newStatus, changedAt, changedBy
   - Relations: Many-to-one with FeatureRequest

### Environment Configuration
- Database connection details are stored in the `.env` file
- SQLite database file is stored at `./dev.db`

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Database Setup
The database has already been set up with the initial migration. If you need to reset the database, you can run:
```
npx prisma migrate reset
```

### Using the Prisma Client
A sample script (`setup.js`) has been created to demonstrate how to use the Prisma client to interact with the database. You can run it with:
```
node setup.js
```

This script demonstrates:
- Creating a new feature request
- Updating the status of a feature request
- Retrieving all feature requests

### Prisma Studio
You can use Prisma Studio to view and edit the database visually:
```
npx prisma studio
```

## Next Steps
- Implement the API endpoints as described in the TRD
- Add authentication and authorization
- Implement validation for request payloads
- Add error handling and logging

## References
- [Technical Requirements Document](docs/trd-backend.md)
- [Prisma Documentation](https://www.prisma.io/docs/)