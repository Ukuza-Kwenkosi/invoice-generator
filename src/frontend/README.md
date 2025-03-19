# Invoice Generator Frontend

A client-side invoice generator application that creates professional-looking PDF invoices directly in the browser.

## Local Development

### Prerequisites

- Node.js (v14+)

### Setup

1. Install dependencies
   ```
   npm install
   ```

2. Start the local development server
   ```
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

- `index.ejs`: Main application template
- `public/`: Static assets (images, styles, etc.)
- `local-server.js`: Development server
- `deploy/`: Deployment scripts and production builds

## Building for Production

1. Build the project:
   ```
   npm run build
   ```

2. Deploy to AWS (requires AWS CLI setup):
   ```
   npm run deploy
   ```

## How It Works

The application uses jsPDF to generate PDF invoices directly in the browser. When running locally:

- The Express.js server renders the EJS template
- Static assets are served from the `public/` directory
- Sample data is provided by the `/data.json` endpoint

## Customization

### Adding New Items (Local)

Edit the sample data in `local-server.js`.

### Changing Logo (Local)

Replace the logo at `public/images/company_logo.png`. 