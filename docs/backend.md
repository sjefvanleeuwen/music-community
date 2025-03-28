# Backend Architecture

## API Routes
The backend will expose RESTful endpoints organized by domain:

### User Management
- `POST /api/auth/register`: Create new user account
- `POST /api/auth/login`: Authenticate user
- `GET /api/auth/me`: Get current user profile
- `PUT /api/auth/me`: Update user profile

### Music Content
- `GET /api/music/albums`: List all albums
- `GET /api/music/albums/:id`: Get specific album
- `POST /api/music/albums`: Create new album
- `PUT /api/music/albums/:id`: Update album details
- `DELETE /api/music/albums/:id`: Delete album
- `GET /api/music/tracks`: List all tracks
- `GET /api/music/tracks/:id`: Get specific track
- `POST /api/music/tracks`: Upload new track
- `PUT /api/music/tracks/:id`: Update track details
- `DELETE /api/music/tracks/:id`: Delete track
- `GET /api/music/stream/:id`: Stream audio file
- `GET /api/music/download/:id`: Download audio file
- `GET /api/music/tracks/:id/remixes`: Get remixes of a specific track
- `GET /api/music/tracks/:id/attribution`: Get original work for a remix
- `POST /api/music/tracks/:id/remixes`: Register a new remix of a track
- `GET /api/music/tracks/:id/relationships`: Get track relationship graph

### Stems
- `GET /api/stems`: List all stems
- `GET /api/stems/:id`: Get specific stem
- `POST /api/stems`: Upload new stem
- `PUT /api/stems/:id`: Update stem details
- `DELETE /api/stems/:id`: Delete stem
- `GET /api/stems/track/:id`: Get all stems for a track
- `GET /api/stems/download/:id`: Download stem file
- `GET /api/stems/instrument-types`: List all instrument types
- `GET /api/stems/:id/usage`: Get tracks using a specific stem
- `GET /api/stems/track/:id/sources`: Get source information for stems in a track
- `POST /api/stems/usage/:id`: Register usage of a stem in a track
- `GET /api/stems/attribution/:id`: Get original work that a stem belongs to

### Genre Management
- `GET /api/genres`: List all genres (flat or hierarchical)
- `GET /api/genres/:id`: Get specific genre
- `GET /api/genres/:id/children`: Get sub-genres for a parent genre
- `GET /api/genres/:id/ancestors`: Get genre ancestry path
- `GET /api/genres/:id/related`: Get related/similar genres
- `GET /api/genres/popular`: Get popular genres
- `GET /api/genres/tree`: Get complete genre hierarchy tree
- `GET /api/music/genres`: Get genres for specific music

### Ratings and Reviews
- `GET /api/ratings/track/:id`: Get ratings for a track
- `POST /api/ratings/track/:id`: Rate a track
- `PUT /api/ratings/track/:id`: Update rating
- `DELETE /api/ratings/track/:id`: Delete rating
- `GET /api/ratings/user`: Get user's ratings

### Events
- `GET /api/events`: List upcoming events
- `GET /api/events/:id`: Get event details
- `GET /api/events/past`: List past events

### Blog
- `GET /api/blog/posts`: List blog posts
- `GET /api/blog/posts/:id`: Get specific post
- `GET /api/blog/categories`: List blog categories

### Contact
- `POST /api/contact`: Submit contact form

## Services Layer
The business logic will be organized into service modules:

- **AuthService**: Handle user authentication and authorization
- **UserService**: Manage user data
- **MusicService**: Manage music catalog and playback
- **UploadService**: Handle file uploads and processing
- **StemService**: Manage stem files and metadata
- **GenreService**: Handle genre classification
- **RatingService**: Manage ratings and reviews
- **EventService**: Handle event data and calendar functionality
- **BlogService**: Manage blog content
- **ContactService**: Process contact submissions

## Data Models
TypeScript interfaces defining data structures:

### User Models
- User profile
- Authentication tokens
- Permissions
- User preferences

### Content Models
- Albums and tracks
- Music metadata
- Stem files with instrument type
- Genre hierarchy and relationships
  - Parent-child relationships
  - Genre attributes by level
  - Cross-genre connections
- Rating and review data
- Events and venues
- Blog posts
- **Track Relationships**:
  - Original-to-remix relationships
  - Multi-level remix tracking
  - Attribution metadata
- **Stem Attribution**:
  - Stem-to-track relationships
  - Usage history and permissions
  - Attribution metadata for stems

## Database Integration
Database design and interaction:

- **SQLite Implementation**: Lightweight file-based database
- **Schema Design**: Normalized data structure
- **Query Layer**: Typed database queries using a SQLite-compatible ORM/query builder
- **Migrations**: Version control for database schema
- **Seeding**: Initial data population
- **Backup Strategy**: Simple file-based backups for SQLite database
- **Performance Considerations**: Optimizing for SQLite's single-writer limitation
- **Connection Management**: Proper connection handling for concurrency

## Schema Design Considerations
Key relationships in database schema:

- **Remix Relationships**: Many-to-many table tracking original works and their remixes
- **Stem Usage**: Junction table tracking which stems are used in which tracks
- **Attribution Chain**: Hierarchical structure for tracking multi-generation remixes
- **Usage Rights**: Permission flags and license information for derivative works

## Authentication System
Security implementation:

- **JWT Tokens**: Stateless authentication
- **OAuth Integration**: Social login options
- **Role-Based Access**: Permission system
- **Password Security**: Hashing and security best practices
- **Rate Limiting**: Prevent brute force attacks

## Media Storage
Strategy for storing and serving music files:

- **File Organization**: Structured hierarchy for audio files and stems
- **Audio Processing**: Format conversion, normalization, and quality options
- **Metadata Extraction**: Parse and store audio file metadata
- **Stem Management**: Organization of multi-track stems
- **Storage Efficiency**: Techniques for reducing storage requirements
- **Access Control**: Permissions for music access
- **Optimization**: Audio format conversion for different devices
- **Caching**: Performance optimization for streaming
- **CDN Integration**: Geographic distribution of audio assets

## Upload Processing
Specialized handling for music and stem uploads:

- **Multi-part Uploads**: Support for large files
- **Chunked Upload**: Resume interrupted uploads
- **Format Validation**: Ensure compatible audio formats
- **Virus Scanning**: Security checks for uploaded content
- **Transcoding Pipeline**: Convert to streaming-friendly formats
- **Waveform Generation**: Create visual representations
- **Metadata Extraction**: Parse embedded audio metadata
- **ID3 Tag Support**: Read and write audio tags
