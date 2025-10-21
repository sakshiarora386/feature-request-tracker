# Feature Request Tracker - Test Documentation

This document outlines the test cases for the database schema and API endpoints implemented in PR #13. These tests ensure that the Prisma ORM implementation and API functionality meet the requirements specified in the issues.

## Table of Contents

1. [Database Schema Tests](#database-schema-tests)
2. [API Endpoint Tests](#api-endpoint-tests)
   - [Create Feature Request](#create-feature-request)
   - [Get All Feature Requests](#get-all-feature-requests)
   - [Get Feature Request by ID](#get-feature-request-by-id)
   - [Update Feature Request Status](#update-feature-request-status)
   - [Delete Feature Request](#delete-feature-request)
3. [Test Setup and Utilities](#test-setup-and-utilities)

## Database Schema Tests

These tests verify that the Prisma schema is correctly implemented and that the database operations work as expected.

### FeatureRequest Model Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Create FeatureRequest | Test creating a new feature request with valid data | Feature request is created with correct fields and default values |
| Required Fields | Test creating a feature request without required fields (title) | Validation error is thrown |
| Field Length Validation | Test creating a feature request with title exceeding 255 characters | Validation error is thrown |
| Default Status | Verify that a new feature request has the default status of "NEW" | Status is set to "NEW" |
| Timestamps | Verify that createdAt and updatedAt fields are automatically set | Fields contain valid timestamps |
| Relationships | Verify that the relationship with StatusChange model works correctly | Feature request can be created with associated status changes |

### StatusChange Model Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Create StatusChange | Test creating a new status change record with valid data | Status change is created with correct fields |
| Required Fields | Test creating a status change without required fields | Validation error is thrown |
| Relationship Integrity | Test that a status change is associated with a valid feature request | Foreign key constraint is enforced |
| Timestamps | Verify that changedAt field is automatically set | Field contains valid timestamp |

## API Endpoint Tests

### Create Feature Request

**Endpoint:** `POST /api/feature-requests`

#### Success Cases

| Test Case | Description | Test Data | Expected Result | Acceptance Criteria |
|-----------|-------------|-----------|-----------------|---------------------|
| Create with Valid Data | Test creating a feature request with valid title and description | `{ "title": "New Feature", "description": "This is a test feature" }` | Status: 201 Created<br>Response: Feature request object with generated ID, "NEW" status, and timestamps | AC1: User can create a new feature request<br>AC2: System assigns a unique ID<br>AC3: System records creation date and user |
| Create with Minimal Data | Test creating a feature request with only required fields (title) | `{ "title": "Minimal Feature" }` | Status: 201 Created<br>Response: Feature request object with null description | AC1: User can create a new feature request with just a title |

#### Error Cases

| Test Case | Description | Test Data | Expected Result | Acceptance Criteria |
|-----------|-------------|-----------|-----------------|---------------------|
| Missing Title | Test creating a feature request without a title | `{ "description": "Missing title" }` | Status: 400 Bad Request<br>Error: Validation error for missing title | AC4: All mandatory fields must be filled |
| Empty Title | Test creating a feature request with an empty title | `{ "title": "", "description": "Empty title" }` | Status: 400 Bad Request<br>Error: Validation error for empty title | AC4: All mandatory fields must be filled |
| Title Too Long | Test creating a feature request with a title exceeding 255 characters | `{ "title": "..." }` (256+ characters) | Status: 400 Bad Request<br>Error: Validation error for title length | Implied by schema constraints |

### Get All Feature Requests

**Endpoint:** `GET /api/feature-requests`

#### Success Cases

| Test Case | Description | Query Parameters | Expected Result | Acceptance Criteria |
|-----------|-------------|------------------|-----------------|---------------------|
| Get All Requests | Test retrieving all feature requests | None | Status: 200 OK<br>Response: Array of feature request objects | AC1: User can view a list of all feature requests |
| Sort by Creation Date (Ascending) | Test sorting by creation date in ascending order | `?sort_by=createdAt&sort_order=asc` | Status: 200 OK<br>Response: Array sorted by createdAt (oldest first) | AC3: List is sortable by creation date |
| Sort by Creation Date (Descending) | Test sorting by creation date in descending order | `?sort_by=createdAt&sort_order=desc` | Status: 200 OK<br>Response: Array sorted by createdAt (newest first) | AC3: List is sortable by creation date |
| Sort by Status | Test sorting by status | `?sort_by=status` | Status: 200 OK<br>Response: Array sorted by status alphabetically | AC3: List is sortable by status |

#### Error Cases

| Test Case | Description | Query Parameters | Expected Result | Acceptance Criteria |
|-----------|-------------|------------------|-----------------|---------------------|
| Invalid Sort Field | Test sorting by an invalid field | `?sort_by=invalid` | Status: 400 Bad Request<br>Error: Validation error for invalid sort field | Implied by validation schema |
| Invalid Sort Order | Test with an invalid sort order | `?sort_by=createdAt&sort_order=invalid` | Status: 400 Bad Request<br>Error: Validation error for invalid sort order | Implied by validation schema |

### Get Feature Request by ID

**Endpoint:** `GET /api/feature-requests/:id`

#### Success Cases

| Test Case | Description | Path Parameter | Expected Result | Acceptance Criteria |
|-----------|-------------|----------------|-----------------|---------------------|
| Get Existing Request | Test retrieving a feature request by a valid ID | Valid UUID | Status: 200 OK<br>Response: Feature request object with matching ID | AC3: User can click on a request to view its full details |
| Include Status History | Verify that status history is included in the response | Valid UUID | Status: 200 OK<br>Response: Feature request object with statusHistory array | Implied by schema relationships |

#### Error Cases

| Test Case | Description | Path Parameter | Expected Result | Acceptance Criteria |
|-----------|-------------|----------------|-----------------|---------------------|
| Non-existent ID | Test retrieving a feature request with a non-existent ID | Non-existent UUID | Status: 404 Not Found<br>Error: Resource not found | Implied by API error handling |
| Invalid ID Format | Test retrieving a feature request with an invalid ID format | Invalid format (not UUID) | Status: 400 Bad Request<br>Error: Invalid ID format | Implied by API error handling |

### Update Feature Request Status

**Endpoint:** `PUT /api/feature-requests/:id/status`

#### Success Cases

| Test Case | Description | Path Parameter / Test Data | Expected Result | Acceptance Criteria |
|-----------|-------------|----------------------------|-----------------|---------------------|
| Update to In Progress | Test updating status from NEW to IN_PROGRESS | Valid UUID / `{ "status": "IN_PROGRESS" }` | Status: 200 OK<br>Response: Updated feature request with new status | AC1: User can update status<br>AC2: System displays current status<br>AC3: System records status change history |
| Update to Completed | Test updating status from IN_PROGRESS to COMPLETED | Valid UUID / `{ "status": "COMPLETED" }` | Status: 200 OK<br>Response: Updated feature request with new status | AC1: User can update status<br>AC2: System displays current status<br>AC3: System records status change history |
| Update to Rejected | Test updating status from NEW to REJECTED | Valid UUID / `{ "status": "REJECTED" }` | Status: 200 OK<br>Response: Updated feature request with new status | AC1: User can update status<br>AC2: System displays current status<br>AC3: System records status change history |
| Status History Creation | Verify that a status change record is created | Valid UUID / `{ "status": "IN_PROGRESS" }` | Status: 200 OK<br>Response: Updated feature request with new statusHistory entry | AC3: System records status change history |

#### Error Cases

| Test Case | Description | Path Parameter / Test Data | Expected Result | Acceptance Criteria |
|-----------|-------------|----------------------------|-----------------|---------------------|
| Non-existent ID | Test updating status for a non-existent feature request | Non-existent UUID / `{ "status": "IN_PROGRESS" }` | Status: 404 Not Found<br>Error: Resource not found | Implied by API error handling |
| Invalid Status | Test updating to an invalid status value | Valid UUID / `{ "status": "INVALID_STATUS" }` | Status: 400 Bad Request<br>Error: Validation error for invalid status | Implied by validation schema |
| Missing Status | Test updating without providing a status | Valid UUID / `{}` | Status: 400 Bad Request<br>Error: Validation error for missing status | Implied by validation schema |

### Delete Feature Request

**Endpoint:** `DELETE /api/feature-requests/:id`

#### Success Cases

| Test Case | Description | Path Parameter | Expected Result | Acceptance Criteria |
|-----------|-------------|----------------|-----------------|---------------------|
| Delete Existing Request | Test deleting a feature request by a valid ID | Valid UUID | Status: 204 No Content | AC1: User can delete an existing feature request<br>AC3: Request is permanently removed |
| Delete with Status History | Verify that associated status history records are also deleted | Valid UUID | Status: 204 No Content<br>Status history records are deleted | Implied by database integrity |

#### Error Cases

| Test Case | Description | Path Parameter | Expected Result | Acceptance Criteria |
|-----------|-------------|----------------|-----------------|---------------------|
| Non-existent ID | Test deleting a feature request with a non-existent ID | Non-existent UUID | Status: 404 Not Found<br>Error: Resource not found | Implied by API error handling |
| Invalid ID Format | Test deleting a feature request with an invalid ID format | Invalid format (not UUID) | Status: 400 Bad Request<br>Error: Invalid ID format | Implied by API error handling |

## Test Setup and Utilities

### Test Database Setup

For testing, we should use a separate test database to avoid affecting the development or production data. The test database should be reset before each test suite runs to ensure a clean state.

```javascript
// Example test setup
beforeAll(async () => {
  // Connect to test database
  testPrisma = new PrismaClient({
    datasourceUrl: process.env.TEST_DATABASE_URL,
  });
});

beforeEach(async () => {
  // Clean up database before each test
  await testPrisma.$transaction([
    testPrisma.statusChange.deleteMany({}),
    testPrisma.featureRequest.deleteMany({}),
  ]);
});

afterAll(async () => {
  // Disconnect from test database
  await testPrisma.$disconnect();
});
```

### Test Utilities

Create helper functions to simplify common test operations:

```javascript
// Example test utilities
async function createTestFeatureRequest(data = {}) {
  return testPrisma.featureRequest.create({
    data: {
      title: data.title || "Test Feature Request",
      description: data.description || "Test Description",
      createdBy: data.createdBy || "test-user",
      ...data,
    },
  });
}

async function updateTestFeatureRequestStatus(id, status, userId = "test-user") {
  const existingFeatureRequest = await testPrisma.featureRequest.findUnique({
    where: { id },
  });
  
  return testPrisma.featureRequest.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          oldStatus: existingFeatureRequest.status,
          newStatus: status,
          changedBy: userId,
        },
      },
    },
    include: {
      statusHistory: true,
    },
  });
}
```

### API Test Examples

Here are examples of how to implement the API tests using a testing framework like Jest and Supertest:

```javascript
// Example API test for creating a feature request
describe("POST /api/feature-requests", () => {
  it("should create a new feature request with valid data", async () => {
    const response = await request(app)
      .post("/api/feature-requests")
      .send({
        title: "New Feature",
        description: "This is a test feature",
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe("New Feature");
    expect(response.body.description).toBe("This is a test feature");
    expect(response.body.status).toBe("NEW");
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("updatedAt");
  });

  it("should return 400 when title is missing", async () => {
    const response = await request(app)
      .post("/api/feature-requests")
      .send({
        description: "Missing title",
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
  });
});
```

This test documentation provides a comprehensive framework for testing the database schema and API endpoints implemented in PR #13, ensuring that they meet the requirements specified in the related issues.