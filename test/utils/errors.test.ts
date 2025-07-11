import { AppError, ErrorType } from '../../src/utils/errors';

describe('Error Utilities', () => {
  describe('AppError', () => {
    it('should create an AppError with message and status code', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should extend Error class properly', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('Error');
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Error');
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

      expect(validationError.type).toBe(ErrorType.VALIDATION);
      expect(notFoundError.type).toBe(ErrorType.NOT_FOUND);
      expect(unauthorizedError.type).toBe(ErrorType.UNAUTHORIZED);
      expect(forbiddenError.type).toBe(ErrorType.FORBIDDEN);
      expect(serverError.type).toBe(ErrorType.SERVER_ERROR);
      expect(authError.type).toBe(ErrorType.AUTHENTICATION);
    });
  });

  describe('Error Serialization', () => {
    it('should maintain properties when converted to string', () => {
      const error = new AppError('Test error', 400, ErrorType.VALIDATION);
      
      const str = error.toString();
      expect(str).toContain('Test error');
    });
  });
});