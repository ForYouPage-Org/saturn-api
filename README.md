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

## 🧪 Testing & Quality Assurance

Our enterprise-grade testing strategy ensures code quality, security, and reliability:

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
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: { statements: 80, branches: 75, functions: 80, lines: 80 },
    './src/modules/auth/**/*.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
    './src/utils/**/*.ts': { statements: 95, branches: 90, functions: 95, lines: 95 }
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/types/**/*.ts']
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

**Made with ❤️ by FYP Saturn Team**

*Building the future of decentralized social media, FYP Saturn: Own Your Orbit*