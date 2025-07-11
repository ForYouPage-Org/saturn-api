// Enterprise-grade Jest configuration with strict coverage requirements
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.spec.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Strict coverage thresholds for production
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    // Critical modules require higher coverage
    './src/modules/auth/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    './src/modules/actors/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    './src/utils/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    },
    './src/middleware/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  },
  
  // Files to include in coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts'
  ],
  
  // Test setup
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Performance settings
  maxWorkers: '50%',
  testTimeout: 30000,
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }
  },
  
  // Verbose output for CI/CD
  verbose: true,
  
  // Error handling
  bail: 1,
  errorOnDeprecated: true,
  
  // Test result formatting
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ]
};