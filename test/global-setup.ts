import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from 'dotenv';

// Global setup runs once before all test suites
export default async (): Promise<void> => {
  console.log('🚀 Starting global test setup...');
  
  // Load test environment variables
  config({ path: '.env.test' });
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_minimum_32_characters_long_for_testing';
  process.env.DISABLE_RATE_LIMITS = 'true';
  process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
  
  // Start MongoDB Memory Server for integration tests
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Store MongoDB URI for tests
  process.env.MONGO_URI_TEST = mongoUri;
  
  // Store server instance globally for cleanup
  (global as any).__MONGO_SERVER__ = mongoServer;
  
  console.log('✅ Global test setup completed');
};