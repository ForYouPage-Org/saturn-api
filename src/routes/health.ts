import { Router, Request, Response } from 'express';
import { MongoClient } from 'mongodb';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        memory: process.memoryUsage(),
      }
    };

    // Test MongoDB Atlas connection using the auth service (which has database access)
    try {
      if (req.services?.authService) {
        // Use the auth service to test database connectivity
        // This is a simple way to verify database access without exposing the db directly
        await req.services.authService.verifyToken('health-check-dummy-token');
        health.services.database = 'connected';
      } else {
        // Fallback database test using direct connection
        const mongoUri = process.env.MONGO_URI;
        if (mongoUri) {
          const client = new MongoClient(mongoUri, {
            serverSelectionTimeoutMS: 2000,
            connectTimeoutMS: 2000,
          });
          
          await client.connect();
          await client.db().admin().ping();
          await client.close();
          health.services.database = 'connected';
        } else {
          health.services.database = 'no_uri';
        }
      }
    } catch (error) {
      // Database connection failed, but that's expected for health checks
      // We'll test with a direct connection instead
      try {
        const mongoUri = process.env.MONGO_URI;
        if (mongoUri) {
          const client = new MongoClient(mongoUri, {
            serverSelectionTimeoutMS: 2000,
            connectTimeoutMS: 2000,
          });
          
          await client.connect();
          await client.db().admin().ping();
          await client.close();
          health.services.database = 'connected';
        } else {
          health.services.database = 'no_uri';
        }
      } catch (dbError) {
        health.services.database = 'disconnected';
        health.status = 'degraded';
      }
    }

    // Return appropriate status code
    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check with more information
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const detailed = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: 'unknown',
          latency: null as number | null,
        },
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
      configuration: {
        port: process.env.PORT || 4000,
        domain: process.env.DOMAIN || 'localhost',
        logLevel: process.env.LOG_LEVEL || 'info',
        mongoUriConfigured: !!process.env.MONGO_URI,
        jwtSecretConfigured: !!process.env.JWT_SECRET,
      }
    };

    // Test MongoDB Atlas connection with timing
    try {
      const startTime = Date.now();
      
      // Direct database test for detailed health check
      const mongoUri = process.env.MONGO_URI;
      if (mongoUri) {
        const client = new MongoClient(mongoUri, {
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
        });
        
        await client.connect();
        await client.db().admin().ping();
        await client.close();
        
        detailed.services.database.latency = Date.now() - startTime;
        detailed.services.database.status = 'connected';
      } else {
        detailed.services.database.status = 'no_uri';
      }
    } catch (error) {
      detailed.services.database.status = 'disconnected';
      (detailed.services.database as any).error = error instanceof Error ? error.message : 'Unknown error';
      detailed.status = 'degraded';
    }

    // Return appropriate status code
    const statusCode = detailed.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(detailed);

  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;