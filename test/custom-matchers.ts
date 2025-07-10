// Custom Jest matchers for enterprise testing

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidObjectId(): R;
      toBeValidActivityPubObject(): R;
      toHaveSecureHeaders(): R;
      toMatchApiResponseSchema(schema: object): R;
    }
  }
}

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => 
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },

  toHaveValidObjectId(received: any) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    const pass = typeof received === 'string' && objectIdRegex.test(received);
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid ObjectId`
          : `expected ${received} to be a valid ObjectId`,
      pass,
    };
  },

  toBeValidActivityPubObject(received: any) {
    const requiredFields = ['@context', 'type', 'id'];
    const hasRequiredFields = requiredFields.every(field => field in received);
    const pass = typeof received === 'object' && hasRequiredFields;
    
    return {
      message: () =>
        pass
          ? `expected object not to be a valid ActivityPub object`
          : `expected object to be a valid ActivityPub object with fields: ${requiredFields.join(', ')}`,
      pass,
    };
  },

  toHaveSecureHeaders(received: any) {
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    const headers = received.headers || {};
    const hasSecureHeaders = requiredHeaders.every(header => 
      headers[header] || headers[header.toLowerCase()]
    );
    
    return {
      message: () =>
        hasSecureHeaders
          ? `expected response not to have secure headers`
          : `expected response to have secure headers: ${requiredHeaders.join(', ')}`,
      pass: hasSecureHeaders,
    };
  },

  toMatchApiResponseSchema(received: any, schema: object) {
    // Basic schema validation - in real implementation, use ajv or joi
    const validateSchema = (obj: any, schemaObj: any): boolean => {
      for (const key in schemaObj) {
        if (!(key in obj)) return false;
        if (typeof schemaObj[key] === 'object' && schemaObj[key] !== null) {
          if (!validateSchema(obj[key], schemaObj[key])) return false;
        }
      }
      return true;
    };

    const pass = validateSchema(received, schema);
    return {
      message: () =>
        pass
          ? `expected response not to match schema`
          : `expected response to match schema`,
      pass,
    };
  },
});

export {};