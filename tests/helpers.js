const { prisma } = require('./setup');

/**
 * Create a test feature request with the given data
 * @param {Object} data - The data for the feature request
 * @returns {Promise<Object>} The created feature request
 */
async function createTestFeatureRequest(data = {}) {
  return prisma.featureRequest.create({
    data: {
      title: data.title || "Test Feature Request",
      description: data.description || "Test Description",
      createdBy: data.createdBy || "test-user",
      ...data,
    },
  });
}

/**
 * Update the status of a test feature request
 * @param {string} id - The ID of the feature request
 * @param {string} status - The new status
 * @param {string} userId - The ID of the user making the change
 * @returns {Promise<Object>} The updated feature request
 */
async function updateTestFeatureRequestStatus(id, status, userId = "test-user") {
  const existingFeatureRequest = await prisma.featureRequest.findUnique({
    where: { id },
  });
  
  return prisma.featureRequest.update({
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

/**
 * Get all feature requests
 * @returns {Promise<Array>} An array of feature requests
 */
async function getAllFeatureRequests() {
  return prisma.featureRequest.findMany({
    include: {
      statusHistory: true,
    },
  });
}

/**
 * Get a feature request by ID
 * @param {string} id - The ID of the feature request
 * @returns {Promise<Object>} The feature request
 */
async function getFeatureRequestById(id) {
  return prisma.featureRequest.findUnique({
    where: { id },
    include: {
      statusHistory: true,
    },
  });
}

/**
 * Delete a feature request by ID
 * @param {string} id - The ID of the feature request
 * @returns {Promise<Object>} The deleted feature request
 */
async function deleteFeatureRequest(id) {
  // Delete the status history first
  await prisma.statusChange.deleteMany({
    where: { featureRequestId: id },
  });
  
  // Then delete the feature request
  return prisma.featureRequest.delete({
    where: { id },
  });
}

module.exports = {
  createTestFeatureRequest,
  updateTestFeatureRequestStatus,
  getAllFeatureRequests,
  getFeatureRequestById,
  deleteFeatureRequest,
};