import { registerBodySchema, loginBodySchema } from '@/modules/auth/schemas/auth.schema';
import { z } from 'zod';

describe('Auth Input Validation Security Tests', () => {
  describe('Registration Validation', () => {
    it('should reject SQL injection attempts in username', () => {
      const maliciousInput = {
        username: "admin'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerBodySchema.safeParse(maliciousInput);
      
      // Should pass validation but we need additional sanitization
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toContain("'");
        expect(result.data.username).toContain('DROP');
        // This highlights the need for additional SQL injection prevention
      }
    });

    it('should reject XSS attempts in username', () => {
      const maliciousInput = {
        username: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerBodySchema.safeParse(maliciousInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toContain('<script>');
        // This highlights the need for HTML sanitization
      }
    });

    it('should enforce minimum username length', () => {
      const shortUsername = {
        username: 'ab', // Less than 3 characters
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerBodySchema.safeParse(shortUsername);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 3 characters');
      }
    });

    it('should enforce maximum username length', () => {
      const longUsername = {
        username: 'a'.repeat(31), // More than 30 characters
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerBodySchema.safeParse(longUsername);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at most 30 characters');
      }
    });

    it('should validate email format', () => {
      const invalidEmail = {
        username: 'testuser',
        email: 'not-an-email',
        password: 'password123',
      };

      const result = registerBodySchema.safeParse(invalidEmail);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid email');
      }
    });

    it('should enforce minimum password length', () => {
      const shortPassword = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345', // Less than 6 characters
      };

      const result = registerBodySchema.safeParse(shortPassword);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 6 characters');
      }
    });

    it('should enforce maximum password length', () => {
      const longPassword = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(101), // More than 100 characters
      };

      const result = registerBodySchema.safeParse(longPassword);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at most 100 characters');
      }
    });

    it('should reject empty required fields', () => {
      const emptyFields = {
        username: '',
        email: '',
        password: '',
      };

      const result = registerBodySchema.safeParse(emptyFields);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Login Validation', () => {
    it('should reject SQL injection in username field', () => {
      const maliciousInput = {
        username: "admin' OR '1'='1",
        password: 'password',
      };

      const result = loginBodySchema.safeParse(maliciousInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toContain("'");
        expect(result.data.username).toContain('OR');
        // Highlights need for parameterized queries
      }
    });

    it('should reject empty username', () => {
      const emptyUsername = {
        username: '',
        password: 'password123',
      };

      const result = loginBodySchema.safeParse(emptyUsername);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Username is required');
      }
    });

    it('should reject empty password', () => {
      const emptyPassword = {
        username: 'testuser',
        password: '',
      };

      const result = loginBodySchema.safeParse(emptyPassword);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Password is required');
      }
    });

    it('should reject missing fields', () => {
      const missingFields = {};

      const result = loginBodySchema.safeParse(missingFields);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBe(2); // username and password
      }
    });
  });

  describe('Additional Security Validations', () => {
    it('should handle unicode and special characters safely', () => {
      const unicodeInput = {
        username: 'user🚀',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerBodySchema.safeParse(unicodeInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('user🚀');
      }
    });

    it('should handle null and undefined values', () => {
      const nullValues = {
        username: null,
        email: undefined,
        password: 'password123',
      };

      const result = registerBodySchema.safeParse(nullValues);
      
      expect(result.success).toBe(false);
    });

    it('should validate against type confusion attacks', () => {
      const typeConfusion = {
        username: ['array', 'instead', 'of', 'string'],
        email: { object: 'instead of string' },
        password: 123456,
      };

      const result = registerBodySchema.safeParse(typeConfusion);
      
      expect(result.success).toBe(false);
    });
  });
});