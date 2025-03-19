# Invoice Generator

A simple, client-side invoice generator application using jsPDF to create professional PDF quotes and invoices directly in the browser.

## Features

- Clean, modern UI
- Client-side PDF generation
- No server dependencies
- Responsive design
- Easy to deploy
- Easy to customize

## Project Structure

```
invoice-generator/
├── src/
│   └── frontend/
│       ├── public/
│       │   ├── images/
│       │   │   └── company_logo.png
│       │   └── data.json
│       ├── index.ejs
│       ├── local-server.js
│       ├── package.json
│       └── package-lock.json
```

## Setup Instructions

1. Navigate to the frontend directory:
   ```
   cd src/frontend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Start the local development server:
   ```
   npm start
   ```

4. Open your browser and go to:
   ```
   http://localhost:3000
   ```

## How It Works

1. Select items from the dropdown
2. Enter quantities for each item
3. Fill in customer information
4. Click "Generate Invoice" to create a PDF
5. The PDF will open automatically in a new tab

## Technologies Used

- HTML/CSS/JavaScript
- jsPDF for PDF generation
- Express.js for local development server
- EJS for templating

## Customization

- Update the logo: Replace `src/frontend/public/images/company_logo.png`
- Update product data: Edit `src/frontend/public/data.json`
- Modify the PDF template: Edit the `generatePDF()` function in `index.ejs`

## Deployment

For deployment, you can:

1. Build a static site using the EJS template
2. Host on any static file hosting service (Netlify, Vercel, GitHub Pages, etc.)
3. Make sure to update the data source URL in production 