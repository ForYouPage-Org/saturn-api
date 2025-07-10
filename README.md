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

### Code Quality

```bash
yarn lint               # Fix linting issues
yarn lint:check         # Check linting without fixing
yarn type-check         # Run TypeScript type checking
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

### Authentication

Most endpoints require authentication via JWT tokens:

```bash
Authorization: Bearer <your_jwt_token>
```

### Error Response Format

```json
{
  "status": "error",
  "type": "VALIDATION",
  "error": "Error message",
  "details": {}
}
```

### Error Types

- `VALIDATION` - Request data validation failed
- `NOT_FOUND` - Requested resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `SERVER_ERROR` - Internal server error

---

## 🔐 Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "id": "user123",
  "username": "johndoe",
  "token": "jwt_token_here"
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user123",
    "username": "johndoe"
  },
  "token": "jwt_token_here"
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
      "id": "post123",
      "content": "Post content",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "actor": {
        "id": "actor123",
        "username": "johndoe",
        "preferredUsername": "John Doe"
      },
      "likes": 5,
      "commentsCount": 2,
      "isLiked": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalItems": 48
  }
}
```

### Create Post

```http
POST /api/posts
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "New post content",
  "attachments": []
}
```

**Response (201):**
```json
{
  "id": "post123",
  "content": "New post content",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "actor": {
    "id": "actor123",
    "username": "johndoe"
  }
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

## 🧪 Testing

Our testing strategy employs a comprehensive approach:

### Test Structure

```
test/
├── integration/           # Full API integration tests
├── helpers/              # Test utilities and setup
├── setup.ts              # Global test configuration
└── tsconfig.json         # TypeScript config for tests
```

### Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test auth.test.ts

# Run with coverage
yarn test:coverage

# Watch mode for development
yarn test:watch
```

### Test Database

Tests use a separate MongoDB database configured via `MONGO_URI_TEST` environment variable.

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

## 🚀 Deployment

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

# Build application
yarn build

# Start production server
yarn start
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

---

## 🔒 Security

### Security Features

- **Helmet.js** - Security headers
- **Rate limiting** - Configurable request limits
- **JWT authentication** - Secure token-based auth
- **Input validation** - Zod schema validation
- **File upload security** - Type and size restrictions
- **CORS protection** - Configurable origin policies

### Security Best Practices

- Keep dependencies updated
- Use strong JWT secrets (32+ characters)
- Configure rate limits appropriately
- Validate all input data
- Implement proper error handling
- Use HTTPS in production
- Regular security audits

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

- All code must pass TypeScript type checking
- ESLint rules must be followed
- Test coverage should not decrease
- API changes must be documented
- Breaking changes require major version bump

### Pull Request Guidelines

- Provide clear description of changes
- Include relevant test cases
- Update documentation if needed
- Ensure CI checks pass
- Request review from maintainers

---

## 📖 Documentation

### Architecture Documents

- **API Reference** - Complete endpoint documentation
- **Testing Strategy** - Testing approach and guidelines
- **Federation Guide** - ActivityPub implementation details
- **Security Guide** - Security considerations and best practices

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
# Clear build cache
yarn clean
yarn build
```

**Database Connection Issues:**
```bash
# Check MongoDB status
mongosh --eval "db.runCommand('ping')"

# Verify connection string
echo $MONGO_URI
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

**Made with ❤️ by FYP Saturn Team**

*Building the future of decentralized social media, FYP Saturn: Own Your Orbit*