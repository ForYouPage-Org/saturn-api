import { MongoRepository } from '../../../../src/modules/shared/repositories/baseRepository';
import type { Collection, Db, Filter, FindOptions, Document, WithId } from 'mongodb';
import { ObjectId } from 'mongodb';
import { jest } from '@jest/globals';

// Mock logger
jest.mock('../../../../src/utils/logger', () => ({
  error: jest.fn(),
}));

// Test implementation of MongoRepository
class TestRepository extends MongoRepository<Document> {
  constructor(db: Db) {
    super(db, 'test-collection');
  }
}

describe('MongoRepository', () => {
  let mockDb: jest.Mocked<Db>;
  let mockCollection: jest.Mocked<Collection<Document>>;
  let testRepository: TestRepository;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      findOneAndUpdate: jest.fn(),
    } as any;

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    testRepository = new TestRepository(mockDb);
  });

  describe('Constructor', () => {
    it('should initialize with correct collection', () => {
      expect(mockDb.collection).toHaveBeenCalledWith('test-collection');
      expect(testRepository['collection']).toBe(mockCollection);
    });
  });

  describe('findById', () => {
    it('should find document by string ObjectId', async () => {
      const mockDocument = {
        _id: new ObjectId(),
        name: 'Test Document',
        value: 42,
      };

      mockCollection.findOne.mockResolvedValue(mockDocument);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await testRepository.findById(mockDocument._id.toString());

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mockDocument._id,
      });
      expect(result).toEqual(mockDocument);
      expect(consoleSpy).toHaveBeenCalledWith(
        `[BaseRepository] Finding document by ID: ${mockDocument._id.toString()}`
      );

      consoleSpy.mockRestore();
    });

    it('should find document by ObjectId', async () => {
      const mockDocument = {
        _id: new ObjectId(),
        name: 'Test Document',
        value: 42,
      };

      mockCollection.findOne.mockResolvedValue(mockDocument);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await testRepository.findById(mockDocument._id);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mockDocument._id,
      });
      expect(result).toEqual(mockDocument);

      consoleSpy.mockRestore();
    });

    it('should try id field if _id not found', async () => {
      const objectId = new ObjectId();
      const mockDocument = {
        _id: objectId,
        id: objectId.toString(),
        name: 'Test Document',
      };

      mockCollection.findOne
        .mockResolvedValueOnce(null) // First call with _id returns null
        .mockResolvedValueOnce(mockDocument); // Second call with id returns document

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await testRepository.findById(objectId.toString());

      expect(mockCollection.findOne).toHaveBeenCalledTimes(2);
      expect(mockCollection.findOne).toHaveBeenNthCalledWith(1, {
        _id: objectId,
      });
      expect(mockCollection.findOne).toHaveBeenNthCalledWith(2, {
        id: objectId.toString(),
      });
      expect(result).toEqual(mockDocument);

      consoleSpy.mockRestore();
    });

    it('should return null for invalid ObjectId', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await testRepository.findById('invalid-id');

      expect(mockCollection.findOne).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error converting ID to ObjectId'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null when document not found', async () => {
      const objectId = new ObjectId();
      mockCollection.findOne.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await testRepository.findById(objectId.toString());

      expect(mockCollection.findOne).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[BaseRepository] No document found with ID: ${objectId}`
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle database errors', async () => {
      const objectId = new ObjectId();
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await testRepository.findById(objectId.toString());

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[BaseRepository] Error finding document by ID ${objectId.toString()}:`,
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle unsupported ID types', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await testRepository.findById(123 as any);

      expect(mockCollection.findOne).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error converting ID to ObjectId'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('should find document by filter', async () => {
      const mockDocument = {
        _id: new ObjectId(),
        name: 'Test Document',
        value: 42,
      };

      const filter = { name: 'Test Document' };
      mockCollection.findOne.mockResolvedValue(mockDocument);

      const result = await testRepository.findOne(filter);

      expect(mockCollection.findOne).toHaveBeenCalledWith(filter);
      expect(result).toEqual(mockDocument);
    });

    it('should return null when no document matches filter', async () => {
      const filter = { name: 'Nonexistent Document' };
      mockCollection.findOne.mockResolvedValue(null);

      const result = await testRepository.findOne(filter);

      expect(mockCollection.findOne).toHaveBeenCalledWith(filter);
      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    it('should find documents with filter and options', async () => {
      const mockDocuments = [
        { _id: new ObjectId(), name: 'Doc1', value: 1 },
        { _id: new ObjectId(), name: 'Doc2', value: 2 },
      ];

      const filter = { value: { $gt: 0 } };
      const options = { limit: 10, sort: { name: 1 } };

      const mockCursor = {
        toArray: jest.fn().mockResolvedValue(mockDocuments),
      };

      mockCollection.find.mockReturnValue(mockCursor as any);

      const result = await testRepository.find(filter, options);

      expect(mockCollection.find).toHaveBeenCalledWith(filter, options);
      expect(result).toEqual(mockDocuments);
    });

    it('should find documents with default empty filter', async () => {
      const mockDocuments = [
        { _id: new ObjectId(), name: 'Doc1', value: 1 },
      ];

      const mockCursor = {
        toArray: jest.fn().mockResolvedValue(mockDocuments),
      };

      mockCollection.find.mockReturnValue(mockCursor as any);

      const result = await testRepository.find();

      expect(mockCollection.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqual(mockDocuments);
    });
  });

  describe('create', () => {
    it('should create document and return with inserted ID', async () => {
      const data = { name: 'New Document', value: 100 };
      const insertedId = new ObjectId();

      mockCollection.insertOne.mockResolvedValue({
        insertedId,
        acknowledged: true,
      } as any);

      const result = await testRepository.create(data);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(data);
      expect(result).toEqual({
        ...data,
        _id: insertedId,
      });
    });
  });

  describe('createWithId', () => {
    it('should create document with specified ObjectId', async () => {
      const objectId = new ObjectId();
      const data = { name: 'Document with ID', value: 200 };

      mockCollection.insertOne.mockResolvedValue({
        insertedId: objectId,
        acknowledged: true,
      } as any);

      const result = await testRepository.createWithId(objectId, data);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...data,
        _id: objectId,
      });
      expect(result).toEqual({
        ...data,
        _id: objectId,
      });
    });

    it('should create document with string ID converted to ObjectId', async () => {
      const objectId = new ObjectId();
      const data = { name: 'Document with String ID', value: 300 };

      mockCollection.insertOne.mockResolvedValue({
        insertedId: objectId,
        acknowledged: true,
      } as any);

      const result = await testRepository.createWithId(objectId.toString(), data);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...data,
        _id: objectId,
      });
      expect(result).toEqual({
        ...data,
        _id: objectId,
      });
    });
  });

  describe('updateById', () => {
    it('should update document by ID with partial data', async () => {
      const objectId = new ObjectId();
      const updates = { name: 'Updated Name', value: 500 };

      mockCollection.updateOne.mockResolvedValue({
        modifiedCount: 1,
        matchedCount: 1,
        acknowledged: true,
      } as any);

      const result = await testRepository.updateById(objectId, updates);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: objectId },
        { $set: updates }
      );
      expect(result).toBe(true);
    });

    it('should update document by ID with update operators', async () => {
      const objectId = new ObjectId();
      const updates = { $inc: { value: 1 }, $set: { name: 'Updated' } };

      mockCollection.updateOne.mockResolvedValue({
        modifiedCount: 1,
        matchedCount: 1,
        acknowledged: true,
      } as any);

      const result = await testRepository.updateById(objectId, updates);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: objectId },
        updates
      );
      expect(result).toBe(true);
    });

    it('should return false when no document is modified', async () => {
      const objectId = new ObjectId();
      const updates = { name: 'Updated Name' };

      mockCollection.updateOne.mockResolvedValue({
        modifiedCount: 0,
        matchedCount: 0,
        acknowledged: true,
      } as any);

      const result = await testRepository.updateById(objectId, updates);

      expect(result).toBe(false);
    });

    it('should handle update errors', async () => {
      const objectId = new ObjectId();
      const updates = { name: 'Updated Name' };

      mockCollection.updateOne.mockRejectedValue(new Error('Update error'));

      const result = await testRepository.updateById(objectId, updates);

      expect(result).toBe(false);
    });
  });

  describe('findOneAndUpdate', () => {
    it('should find and update document', async () => {
      const filter = { name: 'Test Document' };
      const update = { $set: { value: 999 } };
      const options = { returnDocument: 'after' as const };

      const mockUpdatedDocument = {
        _id: new ObjectId(),
        name: 'Test Document',
        value: 999,
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockUpdatedDocument);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await testRepository.findOneAndUpdate(filter, update, options);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        filter,
        update,
        options
      );
      expect(result).toEqual(mockUpdatedDocument);

      consoleSpy.mockRestore();
    });

    it('should handle _id in filter correctly', async () => {
      const objectId = new ObjectId();
      const filter = { _id: objectId.toString() };
      const update = { $set: { value: 777 } };

      const mockUpdatedDocument = {
        _id: objectId,
        name: 'Test Document',
        value: 777,
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockUpdatedDocument);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await testRepository.findOneAndUpdate(filter, update);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: objectId },
        update,
        { returnDocument: 'after' }
      );
      expect(result).toEqual(mockUpdatedDocument);

      consoleSpy.mockRestore();
    });

    it('should return null for invalid _id format', async () => {
      const filter = { _id: 'invalid-id' };
      const update = { $set: { value: 888 } };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await testRepository.findOneAndUpdate(filter, update);

      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid _id format in filter')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null when no document found', async () => {
      const filter = { name: 'Nonexistent Document' };
      const update = { $set: { value: 666 } };

      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await testRepository.findOneAndUpdate(filter, update);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[BaseRepository] findOneAndUpdate returned null'
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle database errors', async () => {
      const filter = { name: 'Test Document' };
      const update = { $set: { value: 555 } };

      mockCollection.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        testRepository.findOneAndUpdate(filter, update)
      ).rejects.toThrow('Database error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[BaseRepository] Error in findOneAndUpdate:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteById', () => {
    it('should delete document by ID', async () => {
      const objectId = new ObjectId();

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
        acknowledged: true,
      } as any);

      const result = await testRepository.deleteById(objectId);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: objectId,
      });
      expect(result).toBe(true);
    });

    it('should return false when no document deleted', async () => {
      const objectId = new ObjectId();

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
        acknowledged: true,
      } as any);

      const result = await testRepository.deleteById(objectId);

      expect(result).toBe(false);
    });
  });

  describe('deleteOne', () => {
    it('should delete document by filter', async () => {
      const filter = { name: 'Document to Delete' };

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
        acknowledged: true,
      } as any);

      const result = await testRepository.deleteOne(filter);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith(filter, undefined);
      expect(result).toBe(true);
    });

    it('should delete document by filter with options', async () => {
      const filter = { name: 'Document to Delete' };
      const options = { hint: { name: 1 } };

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
        acknowledged: true,
      } as any);

      const result = await testRepository.deleteOne(filter, options);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith(filter, options);
      expect(result).toBe(true);
    });

    it('should handle delete errors', async () => {
      const filter = { name: 'Document to Delete' };

      mockCollection.deleteOne.mockRejectedValue(new Error('Delete error'));

      const result = await testRepository.deleteOne(filter);

      expect(result).toBe(false);
    });
  });

  describe('countDocuments', () => {
    it('should count documents with filter', async () => {
      const filter = { value: { $gt: 50 } };

      mockCollection.countDocuments.mockResolvedValue(25);

      const result = await testRepository.countDocuments(filter);

      expect(mockCollection.countDocuments).toHaveBeenCalledWith(filter, undefined);
      expect(result).toBe(25);
    });

    it('should count all documents with empty filter', async () => {
      mockCollection.countDocuments.mockResolvedValue(100);

      const result = await testRepository.countDocuments();

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({}, undefined);
      expect(result).toBe(100);
    });

    it('should count documents with options', async () => {
      const filter = { status: 'active' };
      const options = { limit: 50 };

      mockCollection.countDocuments.mockResolvedValue(15);

      const result = await testRepository.countDocuments(filter, options);

      expect(mockCollection.countDocuments).toHaveBeenCalledWith(filter, options);
      expect(result).toBe(15);
    });
  });

  describe('Private toObjectId method', () => {
    it('should convert string to ObjectId', () => {
      const objectId = new ObjectId();
      const result = testRepository['toObjectId'](objectId.toString());
      expect(result).toEqual(objectId);
    });

    it('should return ObjectId as-is', () => {
      const objectId = new ObjectId();
      const result = testRepository['toObjectId'](objectId);
      expect(result).toBe(objectId);
    });

    it('should throw error for invalid string', () => {
      expect(() => {
        testRepository['toObjectId']('invalid-id');
      }).toThrow('Invalid ID format: invalid-id');
    });

    it('should throw error for unsupported type', () => {
      expect(() => {
        testRepository['toObjectId'](123 as any);
      }).toThrow('Unsupported ID type: number');
    });
  });
});