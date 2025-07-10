import { MongoMemoryServer } from 'mongodb-memory-server';

// Global teardown runs once after all test suites
export default async (): Promise<void> => {
  console.log('🧹 Starting global test teardown...');
  
  // Stop MongoDB Memory Server
  const mongoServer: MongoMemoryServer = (global as any).__MONGO_SERVER__;
  if (mongoServer) {
    await mongoServer.stop();
    console.log('🛑 MongoDB Memory Server stopped');
  }
  
  console.log('✅ Global test teardown completed');
};