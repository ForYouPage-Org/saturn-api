# 🪐 Saturn API

> **A decentralized social media platform built with ActivityPub, TypeScript, and MongoDB**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.17.0-green)](https://www.mongodb.com/)

Saturn is a federated social network built on ActivityPub that prioritizes user control, privacy, and authentic connections. This repository contains the backend API server that powers the Saturn platform.

## ✨ Features

- 🔐 **JWT-based Authentication** - Secure user authentication and session management
- 👥 **Actor Management** - User profiles with customizable settings and federation support
- 📝 **Posts & Comments** - Full CRUD operations for social content
- ❤️ **Engagement System** - Like/unlike posts with real-time updates
- 🔔 **Notifications** - Real-time notification system for user interactions
- 📁 **Media Management** - File upload and media handling with Sharp image processing
- 🌐 **ActivityPub Federation** - Full ActivityPub protocol implementation for federation
- 🔍 **WebFinger Discovery** - User discovery across federated servers
- 🛡️ **Rate Limiting** - Protection against abuse with configurable limits
- 📊 **Structured Logging** - Comprehensive logging with Pino
- 🔒 **Security Headers** - Implementation of security best practices with Helmet
- 🏗️ **Modular Architecture** - Clean, maintainable code structure with dependency injection

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0
- **MongoDB** >= 6.0
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/saturn-api.git
cd saturn-api

# Install dependencies
yarn install

# Copy environment configuration
cp .env.example .env

# Edit your environment variables
# nano .env

# Start development server
yarn dev
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development
DOMAIN=localhost:4000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/fyp-saturn
MONGO_URI_TEST=mongodb://localhost:27017/fyp-saturn-test

# Authentication
JWT_SECRET=your_jwt_secret_here_minimum_32_characters_long
JWT_EXPIRATION=24h

# Logging
LOG_LEVEL=debug

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📁 Project Structure

```
saturn-api/
├── src/                    # Source code
│   ├── config/            # Application configuration
│   ├── middleware/        # Express middleware
│   ├── modules/           # Feature modules
│   │   ├── actors/        # User management
│   │   ├── auth/          # Authentication
│   │   ├── posts/         # Post management
│   │   ├── comments/      # Comment system
│   │   ├── notifications/ # Notification system
│   │   ├── media/         # File upload & media
│   │   ├── activitypub/   # Federation protocol
│   │   ├── webfinger/     # User discovery
│   │   └── shared/        # Shared utilities
│   ├── plugins/           # Plugin system
│   ├── utils/             # Utility functions
│   └── index.ts           # Application entry point
├── test/                  # Test files
│   ├── integration/       # Integration tests
│   ├── helpers/           # Test utilities
│   └── setup.ts           # Test configuration
├── docs/                  # Documentation (legacy)
└── uploads/               # File uploads (gitignored)
```

### Module Architecture

Each feature module follows a consistent structure:

- **models/** - Data models and interfaces
- **repositories/** - Data access layer (MongoDB operations)
- **services/** - Business logic and domain operations
- **controllers/** - HTTP request handlers
- **routes/** - Route definitions and validation
- **schemas/** - Zod validation schemas

## 🛠️ Available Scripts

### Development

```bash
yarn dev                 # Start development server with hot reload
yarn dev:debug          # Start with debugging enabled
yarn build              # Build for production
yarn build:watch        # Build with watch mode
yarn start              # Start production server
```

### Testing

```bash
yarn test               # Run all tests
yarn test:watch         # Run tests in watch mode
yarn test:coverage      # Run tests with coverage report
```

### Code Quality & CI/CD

```bash
# Code quality checks
yarn lint               # Fix linting issues
yarn lint:check         # Check linting without fixing
yarn type-check         # Run TypeScript strict type checking

# Enterprise CI/CD pipeline commands
yarn ci:security        # Run security audit and vulnerability scan
yarn ci:quality         # Run full quality assessment
yarn ci:test            # Run comprehensive test suite with coverage
yarn ci:build           # Build and verify production artifacts
```

### Utilities

```bash
yarn clean              # Clean build artifacts
```

## 📚 API Documentation

### Base URL

All API endpoints are relative to your server's base URL:

```
http://localhost:4000
```

### Testing Server

A live testing server is available at:

```
https://saturn.foryoupage.org/api
```

**Note:** This is a testing environment for development and demonstration purposes. Data may be reset periodically.

**Production Server Architecture:**

- **Landing Page**: `https://saturn.foryoupage.org/` (Static HTML served by nginx)
- **API Endpoints**: `https://saturn.foryoupage.org/api/*` (Proxied to Node.js)
- **Health Check**: `https://saturn.foryoupage.org/health` (Node.js health endpoint)
- **Federation**: `https://saturn.foryoupage.org/.well-known/*` (ActivityPub/WebFinger)

### Authentication

Most endpoints require authentication via JWT tokens:

```bash
Authorization: Bearer <your_jwt_token>
```

### 🔧 **STANDARDIZED ERROR RESPONSE FORMAT**

**All API errors now use a consistent format to prevent frontend integration issues:**

```json
{
  "status": "error",
  "type": "ERROR_TYPE",
  "error": "Human-readable error message",
  "details": {} // Optional: Additional context for validation errors
}
```

### 📋 **Error Types & Status Codes**

| Error Type     | HTTP Status | Description                    | Example Use Case                              |
| -------------- | ----------- | ------------------------------ | --------------------------------------------- |
| `VALIDATION`   | 400         | Request data validation failed | Invalid email format, missing required fields |
| `UNAUTHORIZED` | 401         | Authentication required        | Missing or invalid JWT token                  |
| `FORBIDDEN`    | 403         | Permission denied              | User lacks required permissions               |
| `NOT_FOUND`    | 404         | Requested resource not found   | User/post doesn't exist                       |
| `CONFLICT`     | 409         | Resource conflict              | Username already exists                       |
| `RATE_LIMIT`   | 429         | Too many requests              | Rate limit exceeded                           |
| `SERVER_ERROR` | 500         | Internal server error          | Database connection failed                    |

### 🔍 **Error Response Examples**

**Authentication Error:**

```json
{
  "status": "error",
  "type": "UNAUTHORIZED",
  "error": "Invalid credentials"
}
```

**Validation Error:**

```json
{
  "status": "error",
  "type": "VALIDATION",
  "error": "Request body validation failed",
  "details": {
    "email": {
      "_errors": ["Invalid email format"]
    }
  }
}
```

**Rate Limit Error:**

```json
{
  "status": "error",
  "type": "RATE_LIMIT",
  "error": "Too many authentication attempts, please try again later"
}
```

### 🎯 **Frontend Integration Guide**

**JavaScript Error Handling:**

```javascript
// ✅ CORRECT - Handle standardized error format
try {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Always use data.error for user-facing messages
    throw new Error(data.error || "Unknown error");
  }

  return data;
} catch (error) {
  // Show error.message to user
  showToast(error.message);
}

// ❌ INCORRECT - Don't pass whole object to toast
showToast(data); // This causes "[object Object]" display
```

### 🚀 **Rate Limiting - Environment Specific**

**Development/Testing (Very Permissive):**

- General API: 10,000 requests per minute
- Authentication: 1,000 attempts per minute
- Posts: 1,000 posts per minute
- Media uploads: 500 uploads per minute

**Production (Secure):**

- General API: 100 requests per 15 minutes
- Authentication: 10 attempts per 15 minutes
- Posts: 20 posts per 5 minutes
- Media uploads: 50 uploads per hour

Rate limit headers are included in all responses:

- `RateLimit-Policy: limit;window=duration`
- `RateLimit-Limit: current_limit`
- `RateLimit-Remaining: remaining_requests`
- `RateLimit-Reset: reset_time`

### 📊 **Field Specifications & Data Types**

#### **Actor/User Object**

```typescript
interface Actor {
  _id: string; // MongoDB ObjectId
  id: string; // Same as _id
  username: string; // 3-30 chars, alphanumeric + underscore
  preferredUsername: string; // Display name
  email?: string; // Valid email format (private field)
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

#### **Post Object**

```typescript
interface Post {
  id: string; // Full URL: https://domain.com/posts/uuid
  content: string; // 1-5000 characters
  author: {
    // Author info (not "actor")
    id: string;
    username: string;
    preferredUsername: string;
  };
  published: string; // ISO 8601 timestamp (not "createdAt")
  sensitive: boolean; // Content warning flag
  summary?: string; // Content warning text
  attachments: Attachment[]; // Media attachments
  likes: number; // Like count
  likedByUser: boolean; // Current user's like status (not "isLiked")
  shares: number; // Share count
  sharedByUser: boolean; // Current user's share status
  replyCount: number; // Comment count (not "commentsCount")
  visibility: "public" | "followers" | "unlisted" | "direct";
  url: string; // Full URL to post
}
```

#### **Attachment Object**

```typescript
interface Attachment {
  id: string; // Attachment ID
  type: "image" | "video" | "audio" | "document";
  url: string; // Full URL to media
  name: string; // Original filename
  size: number; // File size in bytes
  mediaType: string; // MIME type
  width?: number; // For images/videos
  height?: number; // For images/videos
}
```

#### **Comment Object**

```typescript
interface Comment {
  id: string; // Comment ID
  content: string; // 1-1000 characters
  author: {
    // Author info
    id: string;
    username: string;
    preferredUsername: string;
  };
  postId: string; // Parent post ID
  published: string; // ISO 8601 timestamp
  inReplyTo?: string; // Parent comment ID (for nested comments)
}
```

#### **Notification Object**

```typescript
interface Notification {
  id: string; // Notification ID
  type: "LIKE" | "COMMENT" | "FOLLOW" | "MENTION" | "SHARE";
  read: boolean; // Read status
  createdAt: string; // ISO 8601 timestamp
  actor: {
    // Who performed the action
    id: string;
    username: string;
    preferredUsername: string;
  };
  object?: {
    // The object being acted upon
    id: string;
    type: "Post" | "Comment" | "User";
    content?: string; // Preview text
  };
}
```

### 🔐 **Authentication Headers**

All protected endpoints require:

```http
Authorization: Bearer <jwt_token>
```

**JWT Token Format:**

- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Payload**: `{ id: string, username: string, iat: number, exp: number }`

---

## 🔐 Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "johndoe", // Required: string, 3-30 chars, alphanumeric + underscore
  "email": "john@example.com", // Required: string, valid email format
  "password": "securePassword123" // Required: string, min 8 chars, must contain uppercase, lowercase, number
}
```

**Response (201):**

```json
{
  "actor": {
    "_id": "6872b97082b9e189bf982804",
    "id": "6872b97082b9e189bf982804",
    "username": "johndoe",
    "preferredUsername": "johndoe",
    "followers": [],
    "following": [],
    "email": "john@example.com",
    "createdAt": "2025-07-12T19:37:20.231Z",
    "updatedAt": "2025-07-12T19:37:20.231Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // JWT token, expires in 24h
}
```

**Validation Errors (400):**

```json
{
  "status": "error",
  "type": "VALIDATION",
  "error": "Request body validation failed",
  "details": {
    "username": {
      "_errors": ["Username must be between 3 and 30 characters"]
    },
    "email": {
      "_errors": ["Invalid email format"]
    },
    "password": {
      "_errors": ["Password must be at least 8 characters long"]
    }
  }
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "username": "johndoe", // Required: string, username or email
  "password": "securePassword123" // Required: string
}
```

**Response (200):**

```json
{
  "actor": {
    "_id": "6872b97082b9e189bf982804",
    "id": "6872b97082b9e189bf982804",
    "username": "johndoe",
    "preferredUsername": "johndoe",
    "followers": [],
    "following": [],
    "email": "john@example.com",
    "createdAt": "2025-07-12T19:37:20.231Z",
    "updatedAt": "2025-07-12T19:37:20.231Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // JWT token, expires in 24h
}
```

**Authentication Errors (401):**

```json
{
  "status": "error",
  "type": "UNAUTHORIZED",
  "error": "Invalid credentials"
}
```

### Get Current User

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": "user123",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

---

## 👥 Actor Endpoints

### Get Actor Profile

```http
GET /api/actors/:username
```

**Response (200):**

```json
{
  "id": "actor123",
  "username": "johndoe",
  "preferredUsername": "John Doe",
  "type": "Person",
  "inbox": "https://example.com/users/johndoe/inbox",
  "outbox": "https://example.com/users/johndoe/outbox",
  "followers": "https://example.com/users/johndoe/followers",
  "following": "https://example.com/users/johndoe/following"
}
```

### Search Actors

```http
GET /api/actors/search?q=searchterm
```

**Response (200):**

```json
{
  "actors": [
    {
      "id": "actor123",
      "username": "johndoe",
      "preferredUsername": "John Doe"
    }
  ]
}
```

### Update Actor

```http
PUT /api/actors/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "preferredUsername": "Updated Name",
  "summary": "Updated bio information"
}
```

---

## 📝 Post Endpoints

### Get Feed

```http
GET /api/posts?page=1&limit=10
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "posts": [
    {
      "id": "https://saturn.foryoupage.org/posts/d6d5ecc2-a589-43c8-aba6-ef2bfbb14f7c",
      "content": "Post content",
      "author": {
        // Note: "author" not "actor"
        "id": "6872b97082b9e189bf982804",
        "username": "johndoe",
        "preferredUsername": "John Doe"
      },
      "published": "2025-07-12T19:38:03.548Z", // Note: "published" not "createdAt"
      "sensitive": false,
      "summary": null,
      "attachments": [],
      "likes": 5,
      "likedByUser": true, // Note: "likedByUser" not "isLiked"
      "shares": 0,
      "sharedByUser": false,
      "replyCount": 2, // Note: "replyCount" not "commentsCount"
      "visibility": "public",
      "url": "https://saturn.foryoupage.org/posts/d6d5ecc2-a589-43c8-aba6-ef2bfbb14f7c"
    }
  ],
  "hasMore": false // Note: "hasMore" instead of pagination object
}
```

**Query Parameters:**

- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 10, max: 50)

### Create Post

```http
POST /api/posts
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "content": "New post content", // Required: string, 1-5000 characters
  "attachments": [], // Optional: array of attachment objects
  "sensitive": false, // Optional: boolean, default false
  "summary": null, // Optional: string, content warning
  "visibility": "public" // Optional: "public"|"followers"|"unlisted"|"direct"
}
```

**Response (201):**

```json
{
  "id": "https://saturn.foryoupage.org/posts/d6d5ecc2-a589-43c8-aba6-ef2bfbb14f7c",
  "content": "New post content",
  "author": {
    "id": "6872b97082b9e189bf982804",
    "username": "johndoe",
    "preferredUsername": "johndoe"
  },
  "published": "2025-07-12T19:38:03.548Z",
  "sensitive": false,
  "summary": null,
  "attachments": [],
  "likes": 0,
  "likedByUser": false,
  "shares": 0,
  "sharedByUser": false,
  "replyCount": 0,
  "visibility": "public",
  "url": "https://saturn.foryoupage.org/posts/d6d5ecc2-a589-43c8-aba6-ef2bfbb14f7c"
}
```

### Like/Unlike Post

```http
POST /api/posts/:id/like
POST /api/posts/:id/unlike
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "likes": 6
}
```

---

## 💬 Comment Endpoints

### Get Comments

```http
GET /api/comments/:postId?page=1&limit=10
```

**Response (200):**

```json
{
  "comments": [
    {
      "id": "comment123",
      "content": "Comment content",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "actor": {
        "id": "actor123",
        "username": "johndoe",
        "preferredUsername": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 2
  }
}
```

### Create Comment

```http
POST /api/comments
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "postId": "post123",
  "content": "Comment content"
}
```

---

## 🔔 Notification Endpoints

### Get Notifications

```http
GET /api/notifications?page=1&limit=10&read=false
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "notifications": [
    {
      "id": "notif123",
      "type": "LIKE",
      "read": false,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "actor": {
        "id": "actor123",
        "username": "johndoe",
        "preferredUsername": "John Doe"
      },
      "post": {
        "id": "post123",
        "content": "Post preview..."
      }
    }
  ]
}
```

### Mark Notifications as Read

```http
POST /api/notifications/mark-read
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "notificationIds": ["notif123", "notif124"]
}
```

---

## 📁 Media Endpoints

### Upload Media

```http
POST /api/media/upload
```

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data`

**Form Data:** `file` field with media file

**Response (201):**

```json
{
  "id": "media123",
  "url": "https://example.com/media/file123.jpg",
  "type": "image/jpeg",
  "size": 1024000
}
```

---

## 🌐 Federation Endpoints

### WebFinger Discovery

```http
GET /.well-known/webfinger?resource=acct:username@domain.com
```

Returns JSON Resource Descriptor (JRD) format for user discovery.

### ActivityPub Actor

```http
GET /users/:username
```

Returns ActivityPub Actor object for federation.

---

## 🧪 Testing & Quality Assurance

Our enterprise-grade testing strategy ensures code quality, security, and reliability:

### Live API Testing Accounts

**Test Server:** `https://saturn.foryoupage.org/api`

We have created several test accounts for comprehensive API testing:

#### Test Accounts

| Username         | Email                  | Password              | Purpose                 | JWT Token (Valid 24h)                                                                                                                                                                                              |
| ---------------- | ---------------------- | --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `testuser`       | `testuser@example.com` | `SecurePassword123!`  | General testing         | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzJiOTcwODJiOWUxODliZjk4MjgwNCIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE3NTIzNTAwMDUsImV4cCI6MTc1MjQzNjQwNX0.Q6Rr56qcCVGdLYUWqdDeKa8d-LYmBzNZbN9Fykdnz9Q`         |
| `adminuser`      | `admin@example.com`    | `AdminPassword123!`   | Admin functionality     | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzJiOTc3ODJiOWUxODliZjk4MjgwNSIsInVzZXJuYW1lIjoiYWRtaW51c2VyIiwiaWF0IjoxNzUyMzUwMDEzLCJleHAiOjE3NTI0MzY0MTN9.IGD1EzGrk77dpHKp4V5FWgBO2iUyXmY3RKpl2eO9atA`        |
| `contentcreator` | `creator@example.com`  | `CreatorPassword123!` | Content & media testing | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzJiOTdmODJiOWUxODliZjk4MjgwNiIsInVzZXJuYW1lIjoiY29udGVudGNyZWF0b3IiLCJpYXQiOjE3NTIzNTAwMjEsImV4cCI6MTc1MjQzNjQyMX0.FlZ05y6sBookbVTlIr5cNFPphtzbLO9E3xUHGYe36NI` |
| `socialuser`     | `social@example.com`   | `SocialPassword123!`  | Social interactions     | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzJiYTE5ODJiOWUxODliZjk4MjgwOSIsInVzZXJuYW1lIjoic29jaWFsdXNlciIsImlhdCI6MTc1MjM1MDAyNywiZXhwIjoxNzUyNDM2NDI3fQ.29wVxMc0iaUzgA7QrgRUoH_Xn3eCumPY8FjrqdTMHk4`      |

**Note:** Tokens expire after 24 hours. Use the login endpoint to get fresh tokens.

#### API Testing Examples

**Health Check:**

```bash
curl https://saturn.foryoupage.org/health
```

**Authentication:**

```bash
# Login
curl -X POST https://saturn.foryoupage.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "SecurePassword123!"}'

# Get current user
curl https://saturn.foryoupage.org/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Posts:**

```bash
# Create a post
curl -X POST https://saturn.foryoupage.org/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"content": "Hello Saturn! 🪐", "attachments": []}'

# Get feed
curl https://saturn.foryoupage.org/api/posts?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Actor Management:**

```bash
# Get actor profile
curl https://saturn.foryoupage.org/api/actors/testuser \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Search actors
curl "https://saturn.foryoupage.org/api/actors/search?q=content" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Federation:**

```bash
# WebFinger discovery
curl "https://saturn.foryoupage.org/.well-known/webfinger?resource=acct:testuser@saturn.foryoupage.org"

# ActivityPub actor
curl https://saturn.foryoupage.org/users/testuser \
  -H "Accept: application/activity+json"
```

**Rate Limiting:**
The API implements environment-specific rate limiting. See the comprehensive rate limiting section above for details.

**✅ Updated**: The production server now uses the improved rate limiting system with much more permissive limits for development/testing!

#### Testing Scenarios

**1. User Registration & Authentication Flow:**

```bash
# Register new user
curl -X POST https://saturn.foryoupage.org/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "email": "new@example.com", "password": "Password123!"}'

# Login with existing account
curl -X POST https://saturn.foryoupage.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "SecurePassword123!"}'

# Verify token with /me endpoint
curl https://saturn.foryoupage.org/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**2. Content Creation & Management:**

```bash
# Create a post with testuser
curl -X POST https://saturn.foryoupage.org/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TESTUSER_TOKEN" \
  -d '{"content": "Testing post creation! 🚀 #test", "attachments": []}'

# Create a post with contentcreator
curl -X POST https://saturn.foryoupage.org/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CONTENTCREATOR_TOKEN" \
  -d '{"content": "Content creator posting amazing content! 🎨 #creative", "attachments": []}'

# Get posts feed
curl https://saturn.foryoupage.org/api/posts?page=1&limit=10 \
  -H "Authorization: Bearer ANY_TOKEN"
```

**3. Social Interactions:**

```bash
# Search for users
curl "https://saturn.foryoupage.org/api/actors/search?q=content" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific user profile
curl https://saturn.foryoupage.org/api/actors/testuser \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**4. Federation Testing:**

```bash
# Test WebFinger discovery
curl "https://saturn.foryoupage.org/.well-known/webfinger?resource=acct:testuser@saturn.foryoupage.org"

# Test ActivityPub actor endpoint
curl https://saturn.foryoupage.org/users/testuser \
  -H "Accept: application/activity+json"

# Test ActivityPub for contentcreator
curl https://saturn.foryoupage.org/users/contentcreator \
  -H "Accept: application/activity+json"
```

**5. Error Handling & Security:**

```bash
# Test invalid credentials
curl -X POST https://saturn.foryoupage.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "wrongpassword"}'

# Test unauthorized access
curl https://saturn.foryoupage.org/api/auth/me \
  -H "Authorization: Bearer invalid_token"

# Test rate limiting (make multiple rapid requests)
for i in {1..5}; do
  curl -X POST https://saturn.foryoupage.org/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "testuser", "password": "SecurePassword123!"}'
done
```

**Active Test Data:**

- **2 Posts created** by test accounts with sample content
- **4 User accounts** ready for interaction testing
- **Federation endpoints** configured and working
- **Rate limiting** active and functional
- **Security headers** properly configured

### Test Structure

```
test/
├── integration/                      # Full API integration tests
├── helpers/                         # Test utilities and setup
├── setup.ts                        # Global test configuration
├── custom-matchers.ts               # Enterprise custom Jest matchers
├── global-setup.ts                  # Global test environment setup
├── global-teardown.ts               # Global test environment cleanup
└── src/modules/                     # Module-specific unit tests
    ├── auth/__tests__/              # Authentication security tests
    ├── media/__tests__/             # File upload security tests
    └── [module]/__tests__/          # Other module tests
```

### Running Tests

```bash
# Run all tests with enterprise configuration
yarn test

# Run with comprehensive coverage analysis
yarn test:coverage

# Run specific test suites
yarn test auth.test.ts
yarn test --testPathPattern=security

# Watch mode for development
yarn test:watch

# Enterprise test configuration (strict coverage)
yarn test --config=jest.config.enterprise.js
```

### Coverage Requirements

Our enterprise testing standards enforce strict coverage thresholds:

- **Global minimum:** 80% statements, 75% branches, 80% functions, 80% lines
- **Authentication module:** 90% across all metrics (critical security)
- **Actor management:** 85% across all metrics
- **Utility functions:** 95% across all metrics (high reliability required)

### Security Testing

Comprehensive security test suites cover:

- **JWT token validation** - Malformed tokens, signature validation, expiration
- **File upload security** - Path traversal, malicious files, size limits
- **Input validation** - SQL injection, XSS, type confusion attacks
- **Authentication middleware** - User lookup errors, database failures

### Test Database

Tests use MongoDB Memory Server for isolated, fast testing without external dependencies.

---

## 🏗️ Development

### Setting Up Development Environment

1. **Install Node.js 18+** - Use `.nvmrc` file: `nvm use`
2. **Install MongoDB** - Local instance or Docker
3. **Install dependencies** - `yarn install`
4. **Configure environment** - Copy `.env.example` to `.env`
5. **Start development** - `yarn dev`

### Code Style

- **ESLint** - Modern flat config with TypeScript rules
- **TypeScript** - Strict mode enabled with path mapping
- **Prettier** - Code formatting (integrated with ESLint)
- **EditorConfig** - Consistent editor settings

### Modular Architecture

#### Creating a New Module

1. Create directory in `src/modules/`
2. Implement the standard structure:
   ```
   your-module/
   ├── models/           # Data models
   ├── repositories/     # Data access
   ├── services/         # Business logic
   ├── controllers/      # HTTP handlers
   ├── routes/           # Route definitions
   ├── schemas/          # Validation schemas
   └── index.ts          # Public exports
   ```
3. Register routes in `src/index.ts`
4. Add tests in `test/`

#### Dependency Injection

Services are managed through a dependency injection container:

```typescript
// Service container provides database connections
const serviceContainer = createServiceContainer(db, domain);

// Services are attached to requests via middleware
app.use(serviceMiddleware(serviceContainer));

// Controllers access services through req.services
const { actorService } = req.services;
```

---

## 🚀 Deployment & CI/CD

### Enterprise CI/CD Pipeline

Our GitHub Actions pipeline provides enterprise-grade quality assurance:

#### **Main CI Pipeline** (`.github/workflows/ci.yml`)

- 🛡️ **Security & Dependency Audit** - CodeQL analysis, npm audit, vulnerability scanning
- 📋 **Code Quality & Standards** - TypeScript strict compilation, ESLint enforcement, dead code detection
- 🧪 **Comprehensive Testing** - Matrix testing (Node 18.20.0 & 20.10.0), MongoDB integration, coverage gates
- 🏗️ **Build & Containerization** - Production build verification, artifact testing

#### **Security Monitoring** (`.github/workflows/security-monitoring.yml`)

- 🔍 **Advanced Security Scanning** - SAST with Semgrep, secret scanning with TruffleHog
- 📈 **Performance Monitoring** - API benchmarks, memory analysis, bundle size tracking
- 🔒 **Infrastructure Security** - Docker vulnerability scanning, workflow security reviews
- 📊 **Automated Reporting** - Daily security reports with GitHub Issues integration

### CI/CD Configuration Files

#### **Enterprise Jest Configuration** (`jest.config.enterprise.js`)

```javascript
// Enterprise-grade testing with strict coverage requirements
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageThreshold: {
    global: { statements: 80, branches: 75, functions: 80, lines: 80 },
    "./src/modules/auth/**/*.ts": {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    "./src/utils/**/*.ts": {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**/*.ts",
  ],
};
```

#### **Pipeline Triggers**

- **Push to main/develop** - Full CI/CD pipeline execution
- **Pull requests** - Quality gates and security checks
- **Daily schedule** - Security monitoring and vulnerability scanning
- **Manual dispatch** - On-demand security scans with configurable scope

#### **Quality Gate Enforcement**

- **TypeScript**: Strict compilation with enterprise settings
- **ESLint**: Zero-error policy with comprehensive rules
- **Security**: No high/critical vulnerabilities allowed
- **Testing**: Coverage thresholds enforced per module
- **Performance**: Automated benchmarking and regression detection

### Quality Gates

All deployments must pass:

- ✅ Zero TypeScript compilation errors
- ✅ Zero ESLint errors (warnings allowed)
- ✅ Minimum test coverage thresholds (50% current, 80% target)
- ✅ No high/critical security vulnerabilities
- ✅ Successful production build
- ✅ Performance benchmarks within acceptable ranges

### Environment Setup

**Production Environment Variables:**

```bash
NODE_ENV=production
PORT=4000
DOMAIN=your-domain.com
MONGO_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-chars
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
```

### Build Process

```bash
# Install dependencies
yarn install --frozen-lockfile

# Run quality checks
yarn lint:check
yarn type-check

# Run comprehensive tests
yarn test:coverage

# Build application
yarn build

# Start production server
yarn start
```

### Production Deployment

#### **Production Architecture**

```
Internet → nginx (Port 80/443) → Node.js API (Port 4000)
              ↓
         Static Landing Page (/var/www/saturn-landing/)
```

**URL Structure:**

- `saturn.foryoupage.org/` → Static landing page
- `saturn.foryoupage.org/api/*` → API endpoints
- `saturn.foryoupage.org/health` → Health check

#### **Production Server Setup**

**1. nginx Configuration**

```nginx
server {
    server_name saturn.foryoupage.org;

    # Landing page - serve static files
    location / {
        root /var/www/saturn-landing;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API endpoints - proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ActivityPub federation endpoints (root level)
    location ~ ^/(\.well-known|users)/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/saturn.foryoupage.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saturn.foryoupage.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

**2. Directory Structure**

```
/var/www/saturn-landing/     # Static landing page
/root/saturn-api/            # Node.js API application
/etc/nginx/sites-available/  # nginx configuration
```

#### **Quick Deployment**

```bash
# Automated deployment with quality checks
yarn deploy
```

#### **Manual Deployment Steps**

```bash
# 1. Install dependencies
yarn install --frozen-lockfile

# 2. Run CI pipeline locally
yarn ci:security  # Security vulnerability scan
yarn ci:quality   # TypeScript and quality checks
yarn ci:build     # Build verification

# 3. Deploy with PM2
yarn deploy:pm2

# 4. Monitor deployment
yarn deploy:logs
```

#### **Updating Production (Step-by-Step)**

```bash
# 1. Pull latest changes
cd /root/saturn-api
git pull origin main

# 2. Install dependencies
yarn install --frozen-lockfile

# 3. Build application
yarn build

# 4. Update static files (if changed)
sudo cp public/index.html /var/www/saturn-landing/
sudo chown -R www-data:www-data /var/www/saturn-landing

# 5. Test nginx configuration
sudo nginx -t

# 6. Reload nginx (if config changed)
sudo systemctl reload nginx

# 7. Restart API server
pm2 restart saturn-api

# 8. Verify deployment
curl -I https://saturn.foryoupage.org/
curl -I https://saturn.foryoupage.org/health
curl -I https://saturn.foryoupage.org/api/health
```

#### **PM2 Process Management**

```bash
# Start/stop/restart
yarn deploy:pm2      # Start with PM2
yarn deploy:stop     # Stop application
yarn deploy:restart  # Restart application

# Monitor logs
yarn deploy:logs     # View real-time logs
pm2 status          # Check process status
pm2 monit           # Real-time monitoring
```

#### **Production Environment Setup**

```bash
# Set up PM2 to start on boot
pm2 startup
pm2 save

# Configure environment variables
cp .env.example .env
# Edit .env with production values

# Ensure MongoDB is running
systemctl status mongod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 4000
CMD ["yarn", "start"]
```

### Infrastructure Requirements

- **Node.js 18+** runtime
- **MongoDB 6.0+** database
- **File storage** for media uploads
- **Reverse proxy** (nginx/traefik) for HTTPS
- **Process manager** (PM2/systemd) for production
- **CI/CD pipeline** with GitHub Actions
- **Security monitoring** for vulnerability management

---

## 🔒 Security & Compliance

### Enterprise Security Features

- **Helmet.js** - Comprehensive security headers (HSTS, CSP, X-Frame-Options)
- **Rate limiting** - Configurable request limits with Redis support
- **JWT authentication** - Secure token-based auth with proper validation
- **Input validation** - Zod schema validation with sanitization
- **File upload security** - Type validation, size limits, path traversal protection
- **CORS protection** - Configurable origin policies
- **Security monitoring** - Automated vulnerability scanning and reporting

### Security Testing & Validation

Our security testing covers:

#### **Authentication Security** (`src/modules/auth/__tests__/auth.middleware.security.test.ts`)

- JWT token validation (malformed, expired, invalid signatures)
- User lookup security and error handling
- Request object sanitization

#### **File Upload Security** (`src/modules/media/__tests__/upload.security.test.ts`)

- File type validation and MIME type verification
- Path traversal attack prevention
- Malicious file detection and blocking
- File size and content validation

#### **Input Validation Security** (`src/modules/auth/__tests__/validation.security.test.ts`)

- SQL injection prevention testing
- XSS attack mitigation validation
- Type confusion attack protection
- Unicode and special character handling

### Automated Security Monitoring

Daily security scans include:

- **SAST Analysis** - Static Application Security Testing with Semgrep
- **Dependency Auditing** - Automated vulnerability scanning of npm packages
- **Secret Scanning** - TruffleHog integration for credential leak detection
- **Container Security** - Docker image vulnerability assessment
- **License Compliance** - Automated license risk assessment

### Security Best Practices

#### Development

- Keep dependencies updated with automated security patches
- Use strong JWT secrets (minimum 32 characters, preferably 64+)
- Configure rate limits based on endpoint sensitivity
- Validate and sanitize all input data
- Implement proper error handling without information disclosure
- Use parameterized queries to prevent SQL injection
- Sanitize file uploads and restrict execution permissions

#### Production

- Use HTTPS exclusively with proper TLS configuration
- Implement proper logging and monitoring
- Regular security audits and penetration testing
- Environment variable security (never commit secrets)
- Database security hardening
- Network segmentation and firewall configuration
- Regular backup and disaster recovery testing

### Compliance & Standards

- **OWASP Top 10** - Comprehensive coverage of web application security risks
- **Security Headers** - A+ rating on securityheaders.com
- **Data Protection** - Privacy-by-design principles
- **Audit Logging** - Comprehensive security event logging
- **Incident Response** - Automated security incident reporting

---

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following our code style
4. **Write** tests for new functionality
5. **Run** the test suite: `yarn test`
6. **Commit** your changes: `git commit -m 'Add amazing feature'`
7. **Push** to the branch: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Code Quality Standards

Our enterprise development standards require:

#### **Mandatory Quality Gates**

- All code must pass TypeScript strict type checking
- Zero ESLint errors (warnings acceptable with justification)
- Minimum test coverage maintained (module-specific thresholds)
- Security tests must pass for authentication and file handling
- All CI/CD pipeline checks must succeed

#### **Testing Requirements**

- Unit tests for all new business logic
- Security tests for authentication and input validation
- Integration tests for API endpoints
- Coverage thresholds: Auth (90%), Core modules (85%), Utils (95%)

#### **Documentation Standards**

- API changes must be documented in README
- Security-sensitive changes require security review
- Breaking changes require major version bump
- Performance impacts must be documented and benchmarked

### Pull Request Guidelines

- Provide clear description of changes
- Include relevant test cases
- Update documentation if needed
- Ensure CI checks pass
- Request review from maintainers

---

## 📖 Documentation

### Architecture Documents

- **API Reference** - Complete endpoint documentation (this README)
- **Testing Strategy** - Enterprise testing approach with security focus
- **CI/CD Pipeline** - Automated quality assurance and deployment
- **Security Architecture** - Comprehensive security testing and monitoring
- **Federation Guide** - ActivityPub implementation details
- **Quality Assurance** - Code quality standards and enforcement

### Additional Resources

- [ActivityPub Specification](https://www.w3.org/TR/activitypub/)
- [WebFinger RFC](https://tools.ietf.org/html/rfc7033)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)

---

## 🛠️ Troubleshooting

### Common Issues

**TypeScript Compilation Errors:**

```bash
# Clear build cache and rebuild
yarn clean
yarn build

# Run strict type checking
yarn type-check

# Check for enterprise config issues
yarn test --config=jest.config.enterprise.js
```

**Database Connection Issues:**

```bash
# Check MongoDB status
mongosh --eval "db.runCommand('ping')"

# Verify connection string
echo $MONGO_URI

# Test with MongoDB Memory Server (for tests)
yarn test test/helpers/testMongoMemory.ts
```

**CI/CD Pipeline Failures:**

```bash
# Run local CI checks
yarn lint:check
yarn type-check
yarn test:coverage

# Check security vulnerabilities
npm audit --audit-level=high

# Test production build
yarn build && node dist/index.js
```

**Test Coverage Issues:**

```bash
# Check current coverage
yarn test:coverage

# View detailed coverage report
open coverage/lcov-report/index.html

# Run enterprise coverage standards
yarn test --config=jest.config.enterprise.js --coverage
```

**Security Scan Failures:**

```bash
# Run local security checks
npm audit --audit-level=moderate

# Check for secrets in code
git secrets --scan

# Validate file upload security
yarn test src/modules/media/__tests__/upload.security.test.ts
```

**Production Deployment Failures:**

```bash
# Check PM2 process status
pm2 status
pm2 logs saturn-api --lines 50

# Verify module resolution
node -e "require('module-alias/register'); console.log('Module alias working')"

# Test database connection
mongosh --eval "db.runCommand('ping')"

# Check environment variables
env | grep -E "(NODE_ENV|PORT|MONGO_URI|JWT_SECRET)"

# Verify build artifacts
ls -la dist/
node dist/index.js --version || echo "Check for module resolution issues"
```

**nginx Configuration Issues:**

```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify nginx is running
sudo systemctl status nginx

# Reload nginx configuration
sudo systemctl reload nginx

# Check if nginx is proxying correctly
curl -I http://localhost:4000/health  # Direct to Node.js
curl -I https://yourdomain.com/health # Through nginx

# Verify static files are served correctly
curl -I https://yourdomain.com/       # Should return HTML
ls -la /var/www/saturn-landing/       # Check static file permissions

# Common nginx proxy issues:
# 1. Missing proxy_pass directive in location blocks
# 2. Incorrect upstream server (should be localhost:4000)
# 3. Missing proxy headers for proper forwarding
# 4. SSL certificate issues with Let's Encrypt
# 5. Incorrect root directory for static files
```

**Module Resolution Issues:**

```bash
# Ensure module-alias is installed in production
yarn add module-alias

# Verify package.json has correct aliases
cat package.json | grep -A 5 "_moduleAliases"

# Check compiled JavaScript imports
grep -r "require('@/" dist/ | head -5
```

**Port Already in Use:**

```bash
# Find process using port 4000
lsof -ti:4000

# Kill process
kill -9 $(lsof -ti:4000)
```

**Environment Variables Not Loading:**

```bash
# Verify .env file exists and is readable
ls -la .env
cat .env

# Check for required variables
grep -E "(JWT_SECRET|MONGO_URI)" .env
```

### Debug Mode

Start the server with debugging enabled:

```bash
yarn dev:debug
```

Then attach your debugger to `localhost:9229`.

### Logs

Application logs are structured and include:

- Request/response logging
- Database operations
- Error details with stack traces
- Performance metrics

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **ActivityPub Community** - For the decentralized social web vision
- **Node.js Ecosystem** - For the incredible tooling and libraries
- **MongoDB Team** - For the excellent database platform
- **TypeScript Team** - For making JavaScript development better
- **Open Source Community** - For inspiration and contributions

---

## 📧 Support

- **Documentation:** [Project Wiki](https://github.com/marx1108/saturn/wiki)
- **Issues:** [GitHub Issues](https://github.com/marx1108/saturn/issues)
- **Discussions:** [GitHub Discussions](https://github.com/marx1108/saturn-api/discussions)
- **Security:** security@saturn-project.com

---

## 🚨 **Frontend Integration Troubleshooting Guide**

### **Common Issues & Solutions**

#### **1. "[object Object]" Error Display**

**Problem:** Error messages showing "[object Object]" instead of readable text.

**Root Cause:** Passing entire error response object to toast/alert instead of the error message.

**Solution:**

```javascript
// ❌ WRONG
const response = await fetch('/api/auth/login', { ... });
const data = await response.json();
showToast(data); // This shows "[object Object]"

// ✅ CORRECT
const response = await fetch('/api/auth/login', { ... });
const data = await response.json();
if (!response.ok) {
  showToast(data.error); // This shows the actual error message
}
```

#### **2. Rate Limit During Development**

**Problem:** Getting rate limited while testing (HTTP 429).

**Current Status:** Production server uses restrictive limits (10 auth attempts per 15 minutes).

**Solutions:**

- **Wait 15 minutes** between auth attempts
- **Use existing test tokens** from the documentation
- **Test non-auth endpoints** which have higher limits
- **After next deployment:** Development will have 1000 attempts per minute

#### **3. Unexpected Field Names**

**Problem:** Frontend expecting `actor` but API returns `author`.

**Key Differences:**

- Posts use `author` (not `actor`)
- Posts use `published` (not `createdAt`)
- Posts use `likedByUser` (not `isLiked`)
- Posts use `replyCount` (not `commentsCount`)
- Feed uses `hasMore` (not pagination object)

**Solution:** Update frontend to use correct field names (see Field Specifications section).

#### **4. Token Expiration**

**Problem:** Tokens expire after 24 hours.

**Solution:**

```javascript
// Check token expiration
const token = localStorage.getItem("token");
const payload = JSON.parse(atob(token.split(".")[1]));
const isExpired = payload.exp * 1000 < Date.now();

if (isExpired) {
  // Redirect to login
  window.location.href = "/login";
}
```

#### **5. CORS Issues**

**Problem:** CORS errors in browser console.

**Solution:** The API includes `Access-Control-Allow-Origin: *` for development. If issues persist, check:

- Request headers are correct
- Content-Type is `application/json`
- Authorization header format: `Bearer <token>`

### **Best Practices for Frontend Teams**

#### **Error Handling**

```javascript
const handleApiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    showToast(error.message);
    throw error;
  }
};
```

#### **Token Management**

```javascript
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiCall = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options.headers,
    },
  });
};
```

#### **Type Safety**

```typescript
// Use the provided TypeScript interfaces
interface ApiResponse<T> {
  data?: T;
  status?: "success" | "error";
  error?: string;
  type?: string;
}

const login = async (
  credentials: LoginCredentials
): Promise<{ actor: Actor; token: string }> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
};
```

### **Quick Reference for Frontend Teams**

| Field           | API Response                                            | Frontend Display        |
| --------------- | ------------------------------------------------------- | ----------------------- |
| User ID         | `actor.id` or `author.id`                               | User profile link       |
| Username        | `actor.username` or `author.username`                   | @username               |
| Display Name    | `actor.preferredUsername` or `author.preferredUsername` | Display name            |
| Post Time       | `published`                                             | Format as "2 hours ago" |
| Like Status     | `likedByUser`                                           | Heart icon state        |
| Like Count      | `likes`                                                 | "5 likes"               |
| Comment Count   | `replyCount`                                            | "3 comments"            |
| Content Warning | `sensitive` + `summary`                                 | Show/hide content       |

---

**Made with ❤️ by FYP Saturn Team**

_Building the future of decentralized social media, FYP Saturn: Own Your Orbit_
