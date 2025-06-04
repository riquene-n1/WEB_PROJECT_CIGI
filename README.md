# Tsubakimoto Chain Search UI

Prototype web interface for managing Tsubakimoto chain catalog data. The
application includes a small Node.js backend using SQLite so data can be stored
locally. Administrators can upload catalog PDFs and images directly through the
web interface. These files are saved under `catalog/` and `images/` and the
database records reference them.

## Features
- Basic pages: Home (search), Login, and Admin
- Product search form that queries the local SQLite database and supports filters for model, specification and tolerance
- Simple login (username/password: `admin`/`admin`) stored in browser session
- Admin page allows adding, updating, or removing products from the database

## Setup
1. Install dependencies with `npm install`
2. Start the server with `npm start`
3. Open `http://localhost:3000/index.html` in a browser

### Adding catalog PDFs
1. Place any existing catalog PDFs in the `catalog/` directory or upload them
   via the Admin page when creating a product entry.
2. Optional: run `node crawler.js` to parse PDFs in bulk and insert entries into
   the SQLite database.

## Next Steps
- Improve PDF parsing logic in `crawler.js` for automatic data extraction
- Add more validations and UI polish
