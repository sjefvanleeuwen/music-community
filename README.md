# Music Community

A platform for musicians to share, collaborate, and grow together.

## Features

- User authentication with email verification
- Music track uploads and sharing
- Stems library for remixing and collaboration
- Genre exploration and classification
- Community features (comments, ratings, favorites)
- Events and blog posts
- User profiles with customizable information

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- SQLite (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/music-community.git
cd music-community
```

2. Install dependencies:
```bash
npm install
```

3. Setup the database:
```bash
npm run db:setup
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Setting Up the Local Mail Server

The application includes a local SMTP server (MailHog) for development purposes, which allows you to test email functionality without needing to configure a real mail server.

### Installation

Run the setup script to download and configure MailHog:

```bash
npm run setup:mailhog
```

This script will:
1. Download the appropriate MailHog binary for your operating system
2. Create startup scripts to easily run the mail server
3. Configure the necessary settings

### Starting the Mail Server

To start the mail server:

#### On Windows:
```bash
npm run mail:start:win
```

#### On macOS/Linux:
```bash
npm run mail:start
```

Alternatively, you can run both the development server and mail server at once:

```bash
npm run dev:with-mail
```

### Accessing the Mail UI

Once started, you can view all sent emails at:
- Web interface: http://localhost:8025
- SMTP server: localhost:1025 (automatically configured in development mode)

### Testing Email Functionality

You can test email sending through the development API:

```bash
curl -X POST http://localhost:3000/api/dev/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

Or test with a specific template:

```bash
curl -X POST http://localhost:3000/api/dev/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","template":"welcome"}'
```

Available templates can be found by calling:

```bash
curl http://localhost:3000/api/dev/email-templates
```

### Email Templates

Email templates are located in `src/server/templates/emails/` and use Handlebars syntax. Available templates include:
- `welcome.hbs` - Welcome email for new users
- `password-reset.hbs` - Password reset link
- `email-verification.hbs` - Email verification link
- `verification-code.hbs` - Verification code for account activation

## Project Structure

- `src/` - Source code
  - `client/` - Frontend code
  - `server/` - Backend code
    - `api/` - API endpoints
    - `db/` - Database setup and migrations
    - `models/` - Data models
    - `services/` - Business logic
    - `utils/` - Utility functions
    - `templates/` - Email templates
  - `shared/` - Shared code between client and server
- `public/` - Static files
- `docs/` - Documentation

## Authentication Flow

1. User registers with email and password
2. System sends verification code to user's email
3. User enters verification code to activate account
4. On successful verification, user is logged in automatically
5. For subsequent logins, user provides username/email and password

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:setup` - Setup the database (migrate + seed)
- `npm run setup:mailhog` - Setup MailHog for email testing
- `npm run mail:start` - Start MailHog (Unix)
- `npm run mail:start:win` - Start MailHog (Windows)
- `npm run dev:with-mail` - Start dev server with MailHog

## License

This project is licensed under the MIT License - see the LICENSE file for details.