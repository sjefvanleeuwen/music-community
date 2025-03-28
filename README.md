# Music Community Website

This project creates a dynamic website for a musician group using TypeScript for both frontend and backend with hot reloading capabilities and native HTMLElement components.

## Project Structure

### Frontend
- **UI Components**: Custom web components based on HTMLElement
- **State Management**: Client-side state management solution
- **Routing**: Client-side routing for different sections
- **Assets**: Images, fonts, and other static resources
- **Styles**: CSS/SCSS for styling components
- **Utils**: Utility functions for the frontend

### Backend
- **API Routes**: RESTful endpoints for data
- **Services**: Business logic layer
- **Data Models**: TypeScript interfaces/types
- **Database Integration**: Data persistence layer
- **Authentication**: User login/registration system
- **Media Storage**: For handling music files, images, etc.

### Core Features
- Band/musician profiles
- Music catalog with playback capabilities
- Music uploads with comprehensive metadata
- Stem management for collaborative creation
- Genre classification and instrument categorization
- Rating and feedback system
- Event calendar and tour dates
- Blog/news section
- Contact form or booking information
- Fan community features (comments, ratings)

### Development Tools
- TypeScript compiler configuration
- Hot reloading setup for development
- Build pipeline for production
- Testing framework
- Linting and formatting
- Deployment configuration

## Technology Stack
- **Language**: TypeScript (frontend and backend)
- **Frontend**: Native Web Components (HTMLElement)
- **Backend**: Node.js with TypeScript
- **Build Tools**: To be determined (webpack/esbuild/etc.)
- **Development Server**: With hot reload capability
- **Database**: SQLite for simplicity and ease of deployment

## Getting Started

### Setting Up and Starting the Backend

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-organization/music-community.git
   cd music-community
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to configure any environment-specific settings.

4. **Database Setup**
   The application uses SQLite, which will be automatically initialized:
   ```bash
   npm run db:setup
   ```
   This will:
   - Create the SQLite database file in the `storage` directory
   - Run all migrations to set up the schema
   - Seed the database with initial data

5. **Starting the Development Server**
   ```bash
   npm run dev
   ```
   This will start the server with hot-reloading enabled at http://localhost:3000.

6. **Starting in Production Mode**
   For production deployment:
   ```bash
   npm run build
   npm start
   ```
   This will compile TypeScript to JavaScript and start the server in production mode.

### API Access

Once the server is running, the API endpoints will be available at:

- API Base URL: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/api/health`

### Default User Accounts

The seed data creates two user accounts:

1. **Admin User**
   - Username: `admin`
   - Password: `admin123`

2. **Demo User**
   - Username: `demo`
   - Password: `demo123`

### Logs

- Application logs are saved in the `logs` directory
- Request logs are displayed in the console during development

## Development Workflow

Information about the development process will be added here.

## Deployment

Deployment instructions will be added here.

## Proposed Project Structure

I'll update the README.md file to include the detailed project structure that was previously created:

```markdown
# Music Community Website

This project creates a dynamic website for a musician group using TypeScript for both frontend and backend with hot reloading capabilities and native HTMLElement components.


## Proposed Project Structure

```bash
music-community/
├── src/                            # Source code
│   ├── client/                     # Frontend code
│   │   ├── components/             # Web components
│   │   │   ├── app/                # Application shell components
│   │   │   ├── auth/               # Authentication components
│   │   │   ├── music/              # Music-related components
│   │   │   ├── stems/              # Stem management components
│   │   │   ├── events/             # Event calendar components
│   │   │   ├── blog/               # Blog/news components
│   │   │   ├── profile/            # User profile components
│   │   │   ├── ui/                 # Shared UI components
│   │   │   └── index.ts            # Component registry
│   │   ├── styles/                 # Global styles
│   │   │   ├── variables.css       # CSS variables
│   │   │   ├── reset.css           # CSS reset
│   │   │   └── global.css          # Global styles
│   │   ├── utils/                  # Frontend utilities
│   │   │   ├── api-client.ts       # API client
│   │   │   ├── audio/              # Audio utilities
│   │   │   ├── auth/               # Authentication utilities
│   │   │   ├── router.ts           # Client-side router
│   │   │   └── store.ts            # State management
│   │   ├── pages/                  # Page components
│   │   ├── assets/                 # Static assets
│   │   └── index.ts                # Entry point
│   │
│   ├── server/                     # Backend code
│   │   ├── api/                    # API routes
│   │   │   ├── auth.ts             # Authentication routes
│   │   │   ├── music.ts            # Music routes
│   │   │   ├── stems.ts            # Stems routes
│   │   │   ├── genres.ts           # Genre routes
│   │   │   ├── ratings.ts          # Rating routes
│   │   │   ├── events.ts           # Event routes
│   │   │   ├── blog.ts             # Blog routes
│   │   │   ├── contact.ts          # Contact routes
│   │   │   └── index.ts            # API router configuration
│   │   ├── services/               # Business logic
│   │   │   ├── auth-service.ts     # Authentication service
│   │   │   ├── user-service.ts     # User management
│   │   │   ├── music-service.ts    # Music catalog 
│   │   │   ├── upload-service.ts   # File upload handling
│   │   │   ├── stem-service.ts     # Stem management
│   │   │   ├── genre-service.ts    # Genre classification
│   │   │   ├── rating-service.ts   # Rating system
│   │   │   ├── event-service.ts    # Event management
│   │   │   ├── blog-service.ts     # Blog content
│   │   │   └── contact-service.ts  # Contact form handling
│   │   ├── models/                 # Data models
│   │   │   ├── user-model.ts       # User model
│   │   │   ├── music-model.ts      # Music model
│   │   │   ├── stem-model.ts       # Stem model
│   │   │   ├── genre-model.ts      # Genre model
│   │   │   ├── rating-model.ts     # Rating model
│   │   │   ├── event-model.ts      # Event model
│   │   │   └── blog-model.ts       # Blog model
│   │   ├── db/                     # Database
│   │   │   ├── connection.ts       # SQLite connection
│   │   │   ├── migrations/         # Migration scripts
│   │   │   └── seeds/              # Seed data
│   │   ├── middleware/             # Express middleware
│   │   │   ├── auth.ts             # Authentication middleware
│   │   │   ├── error-handler.ts    # Error handling
│   │   │   └── validation.ts       # Request validation
│   │   ├── config/                 # Server configuration
│   │   │   ├── env.ts              # Environment config
│   │   │   └── constants.ts        # Application constants
│   │   ├── utils/                  # Server utilities
│   │   └── index.ts                # Server entry point
│   │
│   └── shared/                     # Shared code
│       ├── types/                  # Common TypeScript interfaces
│       │   ├── user.ts             # User interfaces
│       │   ├── music.ts            # Music interfaces
│       │   ├── stem.ts             # Stem interfaces
│       │   ├── genre.ts            # Genre interfaces
│       │   ├── rating.ts           # Rating interfaces
│       │   ├── event.ts            # Event interfaces
│       │   └── blog.ts             # Blog interfaces
│       ├── utils/                  # Shared utilities
│       │   ├── validation.ts       # Validation helpers
│       │   └── formatting.ts       # Formatting helpers
│       └── constants/              # Shared constants
│           ├── genres.ts           # Genre hierarchy
│           └── instruments.ts      # Instrument types
│
├── public/                         # Static assets
│   ├── favicon.ico                 # Favicon
│   ├── images/                     # Public images
│   ├── audio/                      # Sample audio files
│   └── index.html                  # HTML entry point
│
├── config/                         # Build configuration
│   ├── webpack.config.js           # Webpack configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── jest.config.js              # Testing configuration
│   └── eslint.config.js            # Linting configuration
│
├── scripts/                        # Build and utility scripts
│   ├── build.js                    # Build script
│   ├── dev.js                      # Development script
│   ├── test.js                     # Test runner
│   └── db-setup.js                 # Database initialization
│
├── storage/                        # Data storage
│   ├── database.sqlite             # SQLite database file
│   ├── uploads/                    # User-uploaded music
│   │   ├── tracks/                 # Music tracks
│   │   └── stems/                  # Stem files
│   └── backups/                    # Database backups
│
├── tests/                          # Test files
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
│
├── docs/                           # Documentation
│   ├── api/                        # API documentation
│   ├── components/                 # Component documentation
│   └── database/                   # Database schema documentation
│
├── .env.example                    # Example environment variables
├── .gitignore                      # Git ignore file
├── package.json                    # NPM dependencies and scripts
├── README.md                       # Project documentation
└── LICENSE                         # License information
```