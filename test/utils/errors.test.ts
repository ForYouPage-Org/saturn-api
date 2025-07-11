import { AppError, ErrorType } from '../../src/utils/errors';

describe('Error Utilities', () => {
  describe('AppError', () => {
    it('should create an AppError with message and status code', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe(ErrorType.VALIDATION);
      expect(error.details).toEqual({});
    });

    it('should create an AppError with details', () => {
      const details = { field: 'username', reason: 'too short' };
      const error = new AppError('Validation failed', 422, ErrorType.VALIDATION, details);
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.errorType).toBe(ErrorType.VALIDATION);
      expect(error.details).toBe(details);
    });

    it('should extend Error class properly', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ErrorType enum', () => {
    it('should have all required error types', () => {
      expect(ErrorType.VALIDATION).toBe('VALIDATION');
      expect(ErrorType.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorType.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorType.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorType.SERVER_ERROR).toBe('SERVER_ERROR');
      expect(ErrorType.AUTHENTICATION).toBe('AUTHENTICATION');
    });

    it('should be used correctly in AppError', () => {
      const validationError = new AppError('Invalid input', 400, ErrorType.VALIDATION);
      const notFoundError = new AppError('Not found', 404, ErrorType.NOT_FOUND);
      const unauthorizedError = new AppError('Unauthorized', 401, ErrorType.UNAUTHORIZED);
      const forbiddenError = new AppError('Forbidden', 403, ErrorType.FORBIDDEN);
      const serverError = new AppError('Server error', 500, ErrorType.SERVER_ERROR);
      const authError = new AppError('Auth failed', 401, ErrorType.AUTHENTICATION);

      expect(validationError.errorType).toBe(ErrorType.VALIDATION);
      expect(notFoundError.errorType).toBe(ErrorType.NOT_FOUND);
      expect(unauthorizedError.errorType).toBe(ErrorType.UNAUTHORIZED);
      expect(forbiddenError.errorType).toBe(ErrorType.FORBIDDEN);
      expect(serverError.errorType).toBe(ErrorType.SERVER_ERROR);
      expect(authError.errorType).toBe(ErrorType.AUTHENTICATION);
    });
  });

  describe('Error Details', () => {
    it('should handle complex details objects', () => {
      const details = {
        field: 'email',
        reason: 'invalid format',
        suggestions: ['Check for typos', 'Ensure @ symbol is present'],
        metadata: {
          timestamp: new Date().toISOString(),
          userId: 'user123',
        },
      };

      const error = new AppError('Complex validation error', 422, ErrorType.VALIDATION, details);
      
      expect(error.details).toEqual(details);
      expect(error.details.field).toBe('email');
      expect(error.details.suggestions).toHaveLength(2);
      expect(error.details.metadata.userId).toBe('user123');
    });

    it('should handle empty details', () => {
      const error = new AppError('Simple error', 400, ErrorType.VALIDATION);
      
      expect(error.details).toEqual({});
    });

    it('should handle null details', () => {
      const error = new AppError('Simple error', 400, ErrorType.VALIDATION, null);
      
      expect(error.details).toEqual({});
    });
  });

  describe('Error Serialization', () => {
    it('should serialize to JSON properly', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION, { field: 'test' });
      
      const serialized = JSON.stringify(error);
      expect(serialized).toContain('Test error');
      expect(serialized).toContain('field');
      expect(serialized).toContain('test');
    });

    it('should maintain properties when converted to string', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      const str = error.toString();
      expect(str).toContain('Test error');
    });
  });
});