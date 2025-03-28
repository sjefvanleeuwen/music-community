# Getting Started Guide

## Prerequisites
Required software and tools:

- **Node.js**: Version 16.x or later
- **npm**: Version 8.x or later
- **Git**: For version control
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript support
  - ESLint
  - Prettier
  - Web Components support
- **Browser**: Chrome/Firefox with development tools

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-organization/music-community.git
cd music-community
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```
Edit `.env` file with your local configuration values.

### 4. Database Setup
```bash
npm run db:setup
```
This will initialize the SQLite database, create the schema, and seed initial data. The database file will be created in the configured location (typically within the project directory).

### 5. Start Development Server
```bash
npm run dev
```
This launches both frontend and backend with hot reloading.

## Project Structure Overview

```
music-community/
├── src/
│   ├── client/           # Frontend code
│   │   ├── components/   # Web components
│   │   ├── styles/       # Global styles
│   │   ├── utils/        # Frontend utilities
│   │   └── index.ts      # Entry point
│   │
│   ├── server/           # Backend code
│   │   ├── api/          # API routes
│   │   ├── services/     # Business logic
│   │   ├── models/       # Data models
│   │   └── index.ts      # Server entry point
│   │
│   └── shared/           # Shared code
│       ├── types/        # Common TypeScript interfaces
│       └── utils/        # Shared utilities
│
├── public/               # Static assets
├── config/               # Configuration files
├── scripts/              # Build and utility scripts
└── docs/                 # Documentation
```

## Development Workflow

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm test
```

### Linting and Formatting
```bash
npm run lint
npm run format
```

## Debugging

### Frontend Debugging
1. Open Chrome DevTools (F12)
2. Navigate to Sources tab
3. Find your TypeScript files under webpack:// or src/

### Backend Debugging
1. Start the server with inspect flag:
   ```bash
   npm run dev:debug
   ```
2. Attach debugger (VS Code launch configuration provided)

## Common Tasks

### Creating a New Component
1. Create component file in `src/client/components/`
2. Register component in component registry
3. Use the component in HTML with its custom tag

### Adding an API Endpoint
1. Create route handler in `src/server/api/`
2. Register route in the appropriate router
3. Implement service methods if needed
4. Add validation schemas

### Working with the Database
1. Create/modify models in `src/server/models/`
2. Use the data access methods in services
3. Run migrations if schema changes:
   ```bash
   npm run db:migrate
   ```
4. SQLite database file can be inspected with tools like SQLite Browser
5. For debugging, you can run direct queries using the CLI:
   ```bash
   npm run db:query "SELECT * FROM users"
   ```
6. For genre hierarchy, use the recursive relationship in the genres table:
   ```sql
   -- Example of querying genre hierarchy
   WITH RECURSIVE genre_tree AS (
     SELECT id, name, parent_id, 0 AS level
     FROM genres
     WHERE parent_id IS NULL
     UNION ALL
     SELECT g.id, g.name, g.parent_id, gt.level + 1
     FROM genres g
     JOIN genre_tree gt ON g.parent_id = gt.id
   )
   SELECT id, name, parent_id, level FROM genre_tree ORDER BY level, name;
   ```

## Deployment

### Building for Production
```bash
npm run build
```

### Running in Production
```bash
npm start
```

### Deployment Checklist
- Environment variables configured
- Database migrations run
- Static assets optimized
- Security headers set
- SSL certificates configured
