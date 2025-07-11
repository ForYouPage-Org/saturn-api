import config from '../../src/config/index';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Default Configuration', () => {
    it('should provide default configuration values', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have required configuration properties', () => {
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('mongo');
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('domain');
    });

    it('should use default port when not specified', () => {
      delete process.env.PORT;
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.port).toBe(4000);
    });

    it('should use default domain when not specified', () => {
      delete process.env.DOMAIN;
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.domain).toBe('localhost:4000');
    });

    it('should use default node environment when not specified', () => {
      delete process.env.NODE_ENV;
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.env).toBe('development');
    });
  });

  describe('Environment Variable Override', () => {
    it('should use PORT environment variable', () => {
      process.env.PORT = '8080';
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.port).toBe(8080);
    });

    it('should use DOMAIN environment variable', () => {
      process.env.DOMAIN = 'example.com';
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.domain).toBe('example.com');
    });

    it('should use NODE_ENV environment variable', () => {
      process.env.NODE_ENV = 'production';
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.env).toBe('production');
    });

    it('should use MONGO_URI environment variable', () => {
      process.env.MONGO_URI = 'mongodb://custom:27017/db';
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.mongo.uri).toBe('mongodb://custom:27017/db');
    });

    it('should use JWT_SECRET environment variable', () => {
      process.env.JWT_SECRET = 'custom-secret';
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.jwt.secret).toBe('custom-secret');
    });
  });

  describe('Type Safety', () => {
    it('should convert port to number', () => {
      process.env.PORT = '3000';
      const freshConfig = require('../../src/config/index').default;
      
      expect(typeof freshConfig.port).toBe('number');
      expect(freshConfig.port).toBe(3000);
    });

    it('should handle invalid port numbers', () => {
      process.env.PORT = 'invalid';
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.port).toBeNaN(); // parseInt returns NaN for invalid strings
    });

    it('should handle string configuration values', () => {
      process.env.DOMAIN = 'test.example.com';
      process.env.NODE_ENV = 'staging';
      const freshConfig = require('../../src/config/index').default;
      
      expect(typeof freshConfig.domain).toBe('string');
      expect(typeof freshConfig.env).toBe('string');
    });
  });

  describe('Configuration Structure', () => {
    it('should have mongo configuration', () => {
      expect(config.mongo).toBeDefined();
      expect(config.mongo).toHaveProperty('uri');
      expect(typeof config.mongo.uri).toBe('string');
    });

    it('should have jwt configuration', () => {
      expect(config.jwt).toBeDefined();
      expect(config.jwt).toHaveProperty('expiresIn');
      expect(typeof config.jwt.expiresIn).toBe('string');
    });

    it('should have uploads configuration', () => {
      expect(config.uploads).toBeDefined();
      expect(config.uploads).toHaveProperty('avatarDir');
      expect(config.uploads).toHaveProperty('mediaDir');
      expect(config.uploads).toHaveProperty('tempDir');
      expect(config.uploads).toHaveProperty('maxSize');
    });

    it('should have cors configuration', () => {
      expect(config.cors).toBeDefined();
      expect(config.cors).toHaveProperty('origin');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle missing required environment variables', () => {
      delete process.env.MONGO_URI;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        require('../../src/config/index');
      }).not.toThrow();
    });

    it('should provide sensible defaults', () => {
      delete process.env.PORT;
      delete process.env.DOMAIN;
      delete process.env.NODE_ENV;
      
      const freshConfig = require('../../src/config/index').default;
      
      expect(freshConfig.port).toBe(4000);
      expect(freshConfig.domain).toBe('localhost:4000');
      expect(freshConfig.env).toBe('development');
    });
  });
});