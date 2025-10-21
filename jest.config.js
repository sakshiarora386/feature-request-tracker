module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  // before executing the test
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  
  // A map from regular expressions to paths to transformers
  transform: {},
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>'
  ],
  
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
  
  // Allows you to use a custom runner instead of Jest's default test runner
  // runner: "jest-runner",
  
  // The paths to modules that run some code to configure or set up the testing environment
  // setupFiles: [],
  
  // A list of paths to modules that run some code to configure or set up the testing framework
  // setupFilesAfterEnv: [],
};