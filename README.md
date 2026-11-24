
# ShelfSpace Media Library

**Version 0.2.0**

ShelfSpace is a shared media library website built for the
CVTC IT Software Developer Capstone project.

The website allows visitors to browse and organize a shared
collection of games, movies, TV shows, books, and music
albums. Administrators can securely add, edit, and delete
media records stored in a MySQL database.

## Technology Stack

- Node.js 22 or newer
- Express 5
- MySQL
- HTML, CSS, and JavaScript
- Railway for application and database hosting
- Node.js built-in test runner
- Git and GitHub for version control

## Features

### Public Media Library

Visitors can:

- Browse the shared media collection.
- Search for media by title.
- Filter records by media category.
- Filter records by progress status.
- Sort records by title or release year.
- Change the sorting direction.
- View media information without logging in.

Supported categories:

1. Games
2. Movies
3. TV Shows
4. Books
5. Music Albums

Each record includes a title, category, creator, release year,
and progress status.

Optional information includes platform, rating, and notes.

### Administrator Management

Administrators can:

- Log in using configured credentials.
- Add new media records.
- Edit existing media records.
- Delete records after confirmation.
- View and refresh the shared collection.
- Log out of the administrator dashboard.

Media changes are saved in MySQL and remain available
after refreshing the website.

Administrator-only API endpoints require a valid session.
Unauthenticated visitors cannot add, edit, or delete records.

### Database

ShelfSpace uses two main database tables:

- `media_types`: Stores the available media categories.
- `media_items`: Stores individual media records.

Records are associated with their categories using a
foreign key.

The project includes an initial set of 20 sample records.

## Installation

1. Install Node.js 22 or newer and Git.
2. Clone the assigned GitHub repository.
3. Open the project folder in Git Bash.
4. Install dependencies:

```bash
npm install
```

5. Create a MySQL database.
6. Copy `.env.example` to `.env`.
7. Configure the database connection and administrator
   credentials in `.env`.

Example configuration:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
PORT=3000
ADMIN_PASSWORD=REPLACE_WITH_PRIVATE_STRONG_PASSWORD
ADMIN_SESSION_SECRET=REPLACE_WITH_PRIVATE_RANDOM_SECRET
```

The administrator password must contain at least 12
characters. The session secret must contain at least 32
characters.

Never commit actual database credentials, administrator
passwords, or session secrets to GitHub.

Railway can use `MYSQL_URL` instead of `DATABASE_URL`.

## Database Initialization

For a new database, run:

```bash
node db/init.js
```

This executes:

- `db/schema.sql`
- `db/seed.sql`

The initialization script creates the database tables
and inserts the initial sample records.

Database initialization is a setup operation, not a
normal application startup requirement.

Do not automatically rerun the seed script on every
server restart, because intentionally deleted sample
records could be inserted again.

## Running ShelfSpace

Start the website using:

```bash
npm start
```

Open the local website at:

http://localhost:3000

Administrator dashboard:

http://localhost:3000/admin.html

Deployed website:

https://2026-fall-team3-production-4e2c.up.railway.app/

Deployed administrator dashboard:

https://2026-fall-team3-production-4e2c.up.railway.app/admin.html

## API Endpoints

### Public Routes

- `GET /health`: Application health check.
- `GET /health/db`: MySQL connection health check.
- `GET /api/media`: Retrieve shared media records.

The media endpoint supports these optional query parameters:

- `search`
- `category`
- `status`
- `sort`
- `order`

### Administrator Routes

- `GET /api/admin/status`: Check authentication status.
- `POST /api/admin/login`: Administrator login.
- `POST /api/admin/logout`: Administrator logout.
- `GET /api/admin/check`: Verify administrator access.

Protected media management routes:

- `POST /api/media`: Add a media record.
- `PUT /api/media/:id`: Edit an existing record.
- `DELETE /api/media/:id`: Delete an existing record.

All media modification routes require administrator
authentication.

## Testing

ShelfSpace includes automated tests using the Node.js
built-in test runner.

To run the configured test suite:

```bash
npm test
```

To test the website:

```bash
npm run test:web
```

To test the administrator functionality:

```bash
node --test test/admin.test.js
```

To test the media service:

```bash
node --test test/media.test.js
```

To test the actual database connection:

```bash
npm run test:db
```

The database integration test is skipped when neither
`DATABASE_URL` nor `MYSQL_URL` is configured.

When a database URL is configured, the test attempts
a real connection and executes `SELECT 1`.

### Latest Local Test Results

November 23, 2026:

- Total tests: 10
- Passed: 9
- Failed: 0
- Skipped: 1

The database integration test was skipped because a
local database URL was not configured.

Administrator tests verify authentication and protected
media modification operations using mocked database
connections.

Manual testing of the deployed application confirmed
administrator access and media management functionality.

## Security

ShelfSpace includes:

- Administrator password verification.
- Signed, expiring administrator session cookies.
- HTTP-only cookies.
- SameSite cookie restrictions.
- Same-origin checks on modification requests.
- Basic login attempt limiting.
- Server-side validation of media information.
- Parameterized SQL queries.
- Administrator-only modification endpoints.

The application is a capstone project and has not
undergone a comprehensive production security audit.

## Development History

### v0.0.0 - Initial Technology Stack

- Node.js and Express application.
- Basic homepage.
- Health check routes.
- Initial MySQL connection testing.
- Railway deployment setup.

### v0.1.0 - Shared Media Library

- MySQL media database schema.
- Five media categories.
- Initial collection of 20 sample records.
- Public media browsing.
- Search and filter functionality.
- Title and release year sorting.
- Automated media service tests.

### v0.2.0 - Administrator Media Management

- Administrator login and logout.
- Signed administrator sessions.
- Protected media management API.
- Add, edit, and delete functionality.
- Administrator dashboard.
- Input validation.
- Automated authentication and CRUD tests.
- Improved test configuration.

## Project Status

ShelfSpace v0.2.0 implements the core shared media
library and administrator management functionality.

The project continues to be tested and refined as
part of the CVTC IT Software Developer Capstone.
