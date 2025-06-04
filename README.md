# Tsubakimoto Chain Search UI

Prototype web interface for managing Tsubakimoto chain catalog data. The
application includes a small Node.js backend using SQLite so data can be stored
locally. Dummy rows are inserted on first run so the pages have something to
display. Real catalog data will be imported later from an Oracle database after
crawling the official Tsubakimoto site.

## Features
- Basic pages: Home (search), Login, and Admin
- Product search form that queries the local SQLite database and supports filters for model, specification and tolerance
- Simple login (username/password: `admin`/`admin`) stored in browser session
- Admin page allows adding, updating, or removing products from the database

## Setup
1. Install dependencies with `npm install`
2. Start the server with `npm start`
3. Open `http://localhost:3000/index.html` in a browser

### Crawling catalog PDFs
1. Download desired catalog PDFs from the Tsubakimoto website and place them
   in the `catalog/` directory of this project.
2. Install extra dependencies: `npm install pdf-parse` (may require internet
   access).
3. Run `node crawler.js` to parse the PDFs and insert placeholder rows into the
   SQLite database. Adjust the parsing logic to extract real specifications as
   needed.

## Next Steps
- Migrate the dataset to Oracle once the schema is finalized
- Expand the admin features for editing existing entries (update implemented in this version)
- Implement a crawler to collect catalog specifications from
  `https://tsubakimoto-tck.co.kr/goods_main.php` and populate the Oracle
  database with the retrieved information
