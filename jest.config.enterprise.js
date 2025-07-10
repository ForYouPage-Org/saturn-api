/** @type {import('jest').Config} */
module.exports = {
  // Base configuration
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test discovery
  roots: ['<rootDir>/test', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  
  // TypeScript support
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          compilerOptions: {
            // Use strict compilation for tests
            strict: true,
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
            noImplicitOverride: true,
            useUnknownInCatchVariables: true,
          },
        },
      },
    ],
  },
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Setup
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // Coverage configuration (Enterprise standards)
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
    'cobertura', // For CI/CD integration
  ],
  
  // Comprehensive coverage collection
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!src/index.ts', // Entry point excluded
    '!src/**/*.interface.ts',
    '!src/**/*.enum.ts',
    '!src/**/*.constant.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  
  // Enterprise-grade coverage thresholds
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    // Module-specific thresholds
    './src/modules/auth/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    './src/modules/actors/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
    './src/utils/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
  
  // Performance and timeout
  testTimeout: 30000,
  maxWorkers: '50%',
  
  // Error handling
  bail: false, // Don't stop on first failure in CI
  verbose: true,
  
  // Test isolation
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Watch mode (for development)
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: 'coverage/html',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
      },
    ],
  ],
  
  // Global test setup
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
  
  // Environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  
  // Advanced configuration
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: false,
  
  // Error thresholds
  errorOnDeprecated: true,
  
  // Snapshot configuration
  updateSnapshot: false,
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts',
    '<rootDir>/test/custom-matchers.ts',
  ],
};