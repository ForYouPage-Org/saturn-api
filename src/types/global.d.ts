// Global type declarations that don't relate to Express
// Any Express type extensions should go in express.d.ts
import '@types/jest';
import type { MongoClient } from 'mongodb';

declare global {
  namespace NodeJS {
    interface Global {
      __MONGO_URI__: string;
      __MONGO_DB__: string;
      __MONGO_CLIENT__: MongoClient;
    }
  }
}

export {};
