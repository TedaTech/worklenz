# Worklenz Backend

This is the Express.js/TypeScript backend for the Worklenz project management application.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 8.11.0
- PostgreSQL >= 12

## Getting Started

### 1. Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.template .env
```

Update the `.env` file with your specific configuration. Key variables include:

- **Database**: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`
- **Server**: `PORT`, `NODE_ENV`, `SESSION_SECRET`, `COOKIE_SECRET`
- **Frontend**: `FRONTEND_URL`, `SERVER_CORS`
- **Email**: Configure SMTP or AWS SES (see Email Configuration section below)
- **Storage**: Configure either S3 or Azure Blob Storage
- **Authentication**: Google OAuth credentials if needed

### 2. Database Setup

Create and initialize the database:

```bash
# Create database
createdb worklenz_db

# Run SQL setup files in order
psql -U postgres -d worklenz_db -f database/sql/0_extensions.sql
psql -U postgres -d worklenz_db -f database/sql/1_tables.sql
psql -U postgres -d worklenz_db -f database/sql/indexes.sql
psql -U postgres -d worklenz_db -f database/sql/4_functions.sql
psql -U postgres -d worklenz_db -f database/sql/triggers.sql
psql -U postgres -d worklenz_db -f database/sql/3_views.sql
psql -U postgres -d worklenz_db -f database/sql/2_dml.sql
psql -U postgres -d worklenz_db -f database/sql/5_database_user.sql
```

Or use the provided script:

```bash
chmod +x database/00-init-db.sh
./database/00-init-db.sh
```

### 3. Install Dependencies

```bash
npm install
```

## Development

### Quick Start

Run both build watch and server with auto-restart:

```bash
npm run dev:all
```

This single command replaces the need to run `npm run dev` and `npm start` separately. It:
- Builds the TypeScript code in development mode
- Watches for file changes and rebuilds automatically
- Runs the server with nodemon for auto-restart on changes

### Alternative Development Commands

```bash
# Build and watch files only (no server)
npm run dev

# Build once for development
npm run build:dev

# Start server only (after building)
npm start
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Build and watch files for development |
| `npm run dev:all` | Build, watch, and auto-restart server for development (recommended) |
| `npm run build` | Standard build |
| `npm run build:dev` | Development build |
| `npm run build:prod` | Production build with minification and compression |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run clean` | Clean build directory |
| `npm run compile` | Compile TypeScript |
| `npm run compile:dev` | Compile TypeScript for development |
| `npm run watch` | Watch TypeScript and asset files |
| `npm run watch:ts` | Watch TypeScript files only |
| `npm run watch:assets` | Watch asset files only |

## API Documentation

The API follows RESTful design principles with endpoints prefixed with `/api/`.

### Authentication

The API uses JWT tokens for authentication. Protected routes require a valid token in the Authorization header.

### Email Configuration

Configure email delivery via SMTP or AWS SES in your `.env` file.

**SMTP** (Gmail, Outlook, SendGrid, Mailgun, etc.):
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM_NAME=Worklenz
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

**AWS SES**:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Note**: Existing AWS SES deployments automatically use SES when AWS credentials are present. Set `EMAIL_PROVIDER=smtp` to explicitly use SMTP instead.

### File Storage

The application supports both S3-compatible storage and Azure Blob Storage for file uploads. Configure your preferred storage option in the `.env` file.

## Development Guidelines

- Code should be written in TypeScript
- Follow the established patterns for controllers, services, and middlewares
- Add proper error handling for all API endpoints
- Write unit tests for critical functionality
- Document API endpoints with clear descriptions and examples

## Running Tests

```bash
npm test
```

## Docker Support

The backend can be run in a Docker container. See the main project README for Docker setup instructions.