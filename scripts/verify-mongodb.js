#!/usr/bin/env node

// MongoDB Atlas Connection Verification Script
require('module-alias/register');
require('dotenv').config();

const { MongoClient } = require('mongodb');

async function verifyMongoDBAtlas() {
  console.log('🔍 Verifying MongoDB Atlas connection...\n');
  
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGO_URI environment variable not found');
    console.log('Please check your .env file contains MONGO_URI');
    process.exit(1);
  }
  
  console.log(`📡 Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  
  let client;
  
  try {
    // Create MongoDB client
    client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('⏳ Attempting connection...');
    
    // Connect to MongoDB Atlas
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    const db = client.db();
    console.log(`📊 Connected to database: ${db.databaseName}`);
    
    // Ping the database
    const pingResult = await db.admin().ping();
    console.log('🏓 Database ping successful:', pingResult);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Test write operation (create a test document)
    const testCollection = db.collection('connection_test');
    const testDoc = {
      timestamp: new Date(),
      test: 'MongoDB Atlas connection verification',
      app: 'saturn-api'
    };
    
    console.log('\n🧪 Testing write operation...');
    const writeResult = await testCollection.insertOne(testDoc);
    console.log('✅ Write test successful, inserted ID:', writeResult.insertedId);
    
    // Test read operation
    console.log('🧪 Testing read operation...');
    const readResult = await testCollection.findOne({ _id: writeResult.insertedId });
    console.log('✅ Read test successful:', readResult ? 'Document found' : 'Document not found');
    
    // Clean up test document
    await testCollection.deleteOne({ _id: writeResult.insertedId });
    console.log('🧹 Cleaned up test document');
    
    // Check indexes
    console.log('\n📋 Checking database indexes...');
    try {
      const actors = db.collection('actors');
      const indexes = await actors.indexes();
      console.log(`📊 Actors collection has ${indexes.length} indexes`);
    } catch (error) {
      console.log('ℹ️  Actors collection not found (normal for new database)');
    }
    
    console.log('\n✅ MongoDB Atlas verification completed successfully!');
    console.log('🚀 Your application should be able to connect to the database.');
    
  } catch (error) {
    console.error('\n❌ MongoDB Atlas connection failed:');
    console.error('Error:', error.message);
    
    // Provide troubleshooting suggestions
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check your MongoDB Atlas cluster is running');
    console.log('2. Verify your IP address is whitelisted in Atlas');
    console.log('3. Check username/password in connection string');
    console.log('4. Ensure network connectivity to Atlas');
    console.log('5. Check if cluster is in the correct region');
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔑 Authentication Error - Check:');
      console.log('   - Username and password in MONGO_URI');
      console.log('   - Database user permissions in Atlas');
    }
    
    if (error.message.includes('connection') || error.message.includes('timeout')) {
      console.log('\n🌐 Connection Error - Check:');
      console.log('   - Internet connectivity');
      console.log('   - Firewall settings');
      console.log('   - Atlas IP whitelist (0.0.0.0/0 for development)');
    }
    
    process.exit(1);
    
  } finally {
    if (client) {
      await client.close();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run verification
verifyMongoDBAtlas().catch(console.error);