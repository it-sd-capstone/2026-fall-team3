# ShelfSpace Media Library

ShelfSpace is a proposed website for keeping track of personal media collections in one place. Users will eventually be able to organize games, movies, TV shows, and books, instead of maintaining separate lists. The first release is a small skeleton website meant to prove that our Node.js, Express, and MySQL tools work together. Additional features such as adding and searching media will be developed after the technology stack has been validated.

## Installation

1. Install Node.js 22 or newer and Git.
2. Clone the **assigned team project** repository and open it in your editor.
3. From the project's root directory in Git Bash, run `npm install`. This creates `node_modules/` and `package-lock.json`.
4. Configure a MySQL database, either locally or as a MySQL service in Railway.
5. Copy `.env.example` to `.env` and replace `DATABASE_URL` with a **working local-accessible database URL**. For Railway, a database's private `MYSQL_URL` works within Railway services; local testing may require its `MYSQL_PUBLIC_URL`, which requires enabling database public access. Never commit the `.env` file or share the credentials.

## Testing

- Run `npm run test:web` to test Express's homepage and `/health` route.
- Run `npm run test:db` to test a real MySQL connection and a `SELECT 1` SQL query. This test should fail when database credentials are missing or the database is unreachable.
- Run `npm test` to execute all tests **after a working database URL has been configured**.
- To validate deployment, open `https://YOUR-DEPLOYED-DOMAIN/health` and `/health/db` in a browser. The expected results are HTTP 200 responses with `status: "ok"` and `database: "connected"` respectively.
- Record the date, test results, and deployment URL before publishing the release. A successful webpage test by itself does not prove the database works.

## Usage

- Run npm install to install the project's dependencies.
- Run npm start to start the ShelfSpace website locally.
- Open http://localhost:3000 in a browser to access the local website.
- The deployed website is available at https://2026-fall-team3-production-4e2c.up.railway.app/.
- ShelfSpace currently provides a basic homepage and health checks for the Express server and MySQL database.
- Future updates will allow users to add, edit, delete, search, and organize games, movies, TV shows, and books.
