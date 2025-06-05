# Tsubakimoto Chain Search UI

Prototype web interface for managing Tsubakimoto chain catalog data. The
application includes a small Node.js backend using SQLite so data can be stored
locally. Administrators can upload catalog PDFs and images directly through the
web interface. Uploaded PDFs are parsed server-side so that model number,
specification and tolerance fields are filled automatically when possible.
Uploaded files are stored under `catalog/` and `images/` and referenced from the
database.

## Features
- Crawler script builds a `chains.json` file so data can be loaded without a database
- Basic pages: Home (search), Login/Sign‑up and Admin with a modern layout
- Product search with drop-down filters for model, specification and tolerance
- Server API `/api/chains` supports query parameters for filtered search
- Registered users can view their recent search history
- Guest searches are kept only for the current session
- Admin page allows adding, updating or removing products
- Users can change their password after logging in
- Default admin credentials are `admin`/`admin` (passwords are stored hashed and sessions use cookies)
- Each result links to a dedicated detail page
- Dedicated History page shows your recent searches
- Modern CSS styles with the Roboto font for a cleaner look
- Pages include a logout link to clear the session

## Setup
1. Install dependencies with `npm install`
2. Start the server with `npm start`
3. Open `http://localhost:3000/index.html` in a browser. Use the Login link to
   visit `http://localhost:3000/login.html` and sign in with the default
   `admin`/`admin` credentials. Pages must be served through the running
   server; opening the HTML files directly will prevent login from working.
   Your login state is kept using cookies.

The server inserts several sample rows on first start so you can immediately
experiment with the interface. The dummy rows reference placeholder PDFs stored
in the `catalog/` folder. Visit the Admin page to view, edit or remove these
entries.

### Demo Use
The included HTML pages and dummy rows are sufficient for a short demo or
presentation. Start the server and open the Home page to search the preloaded
entries. Log in as `admin`/`admin` to try the admin interface and modify the
sample data. Use the **History** link to review your recent search queries.

### Adding catalog PDFs
1. Place any existing catalog PDFs in the `catalog/` directory or upload them
   via the Admin page when creating a product entry. Uploaded files are scanned
   and the extracted details are used to populate new database rows.
2. Run `node crawler.js` to download catalog PDFs and build `chains.json` containing the parsed fields.

### Exporting data
Run `npm run export` to generate an `export.csv` file with the current chain
entries. This CSV can then be imported into Oracle or other systems.

### Changing your password
After logging in, open `change_password.html` from the navigation bar. Submit
your current and new password to update your account.

## Next Steps
- Tune PDF parsing logic for better accuracy and support more catalog formats
- Add validations and UI polish
- Extend `crawler.js` to capture additional fields like chain size and material.
