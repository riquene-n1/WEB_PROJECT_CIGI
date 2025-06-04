# Tsubakimoto Chain Search UI

Prototype web interface for managing Tsubakimoto chain catalog data. The
application includes a small Node.js backend using SQLite so data can be stored
locally. Administrators can upload catalog PDFs and images directly through the
web interface. Uploaded PDFs are parsed server-side so that model number,
specification and tolerance fields are filled automatically when possible.
Uploaded files are stored under `catalog/` and `images/` and referenced from the
database.

## Features
- Basic pages: Home (search), Login, and Admin
- Product search form that queries the local SQLite database and supports filters for model, specification and tolerance
- Simple login (username/password: `admin`/`admin`) stored in browser session
- Admin page allows adding, updating, or removing products from the database
- Admin page shows a table of all stored items for quick management

## Setup
1. Install dependencies with `npm install`
2. Start the server with `npm start`
3. Open `http://localhost:3000/index.html` in a browser

The server inserts several sample rows on first start so you can immediately
experiment with the interface. The dummy rows reference placeholder PDFs stored
in the `catalog/` folder. Visit the Admin page to view, edit or remove these
entries.

### Demo Use
The included HTML pages and dummy rows are sufficient for a short demo or
presentation. Start the server and open the Home page to search the preloaded
entries. Log in as `admin`/`admin` to try the admin interface and modify the
sample data.

### Adding catalog PDFs
1. Place any existing catalog PDFs in the `catalog/` directory or upload them
   via the Admin page when creating a product entry. Uploaded files are scanned
   and the extracted details are used to populate new database rows.
2. Optional: run `node crawler.js` to parse PDFs in bulk and insert entries into
   the SQLite database.

## Next Steps
- Tune PDF parsing logic for better accuracy and support more catalog formats
- Add validations and UI polish
