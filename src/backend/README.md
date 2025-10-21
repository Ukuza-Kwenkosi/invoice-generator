# Invoice Generator Backend

Backend Lambda functions for the invoice generator application.

## Architecture

- **Runtime**: AWS Lambda (Node.js 18.x)
- **Database**: Supabase (PostgreSQL)
- **Framework**: Serverless Framework
- **Region**: af-south-1 (Africa - Cape Town)

## Local Development

### Prerequisites

1. Node.js 18.x or higher
2. npm or yarn
3. Serverless Framework
4. Supabase account with project

### Setup

1. **Install dependencies**:
   ```bash
   cd src/backend
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** in `.env`:
   - `ADMIN_USERNAME`: Admin username for backoffice login
   - `ADMIN_PASSWORD`: Admin password (also used as API key)
   - `SUPABASE_API_URL`: Your Supabase project URL
   - `SUPABASE_API_KEY`: Your Supabase anon/public key

### Running Locally

Start the local development server:

```bash
npm run dev
```

This will start `serverless-offline` on `http://localhost:3000` with all your Lambda functions accessible at:

- `GET  http://localhost:3000/api/health` - Health check
- `POST http://localhost:3000/api/auth/login` - Login
- `POST http://localhost:3000/api/auth/logout` - Logout
- `GET  http://localhost:3000/api/products` - Get all products
- `GET  http://localhost:3000/api/products/{id}` - Get single product
- `POST http://localhost:3000/api/products` - Create product (requires auth)
- `PUT  http://localhost:3000/api/products/{id}` - Update product (requires auth)
- `DELETE http://localhost:3000/api/products/{id}` - Delete product (requires auth)
- `POST http://localhost:3000/api/generate-invoice` - Generate invoice PDF

### Testing Endpoints

You can test endpoints using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Get products
curl http://localhost:3000/api/products

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Update product (with auth)
curl -X PUT http://localhost:3000/api/products/Carpet%20Pinboard \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-password" \
  -d '{"name":"Carpet Pinboard","sizes":[...]}'
```

## Deployment

Deploy to AWS Lambda:

```bash
npm run deploy
```

This will:
1. Build the Lambda functions using esbuild
2. Deploy to AWS using Serverless Framework
3. Set up API Gateway endpoints
4. Configure environment variables from your local environment

Make sure you have:
- AWS CLI configured with credentials
- Environment variables set in your shell or CI/CD pipeline

## Project Structure

```
src/backend/
├── src/
│   ├── lambda/              # Lambda function handlers
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── health.ts       # Health check
│   │   ├── invoice.ts      # Invoice generation
│   │   └── products.ts     # Product CRUD operations
│   ├── data/               # Database layer
│   │   ├── database.factory.ts
│   │   ├── database.interface.ts
│   │   └── supabase-db.ts  # Supabase implementation
│   ├── utils/              # Utilities
│   │   ├── formatting.ts   # Currency/number formatting
│   │   └── logger.ts       # Winston logger
│   └── types/              # TypeScript types
│       └── product.ts
├── scripts/
│   ├── fetch-prod-data.ts  # Fetch data from production
│   └── migrate-to-supabase.ts  # Migration script
├── serverless.yml          # Serverless Framework config
├── package.json
└── tsconfig.json
```

## Environment Variables

### Required for Development
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password (also API key)
- `SUPABASE_API_URL` - Supabase project URL
- `SUPABASE_API_KEY` - Supabase public key
- `NODE_ENV` - Set to 'development' for local dev

### Required for Production
Same as development, plus these are set automatically:
- `AWS_REGION` - AWS region (set by Serverless)
- `CORS_ORIGIN` - CloudFront distribution URL

## Authentication

The API uses a simple API key authentication:
- Login endpoint returns an API key (which is the ADMIN_PASSWORD)
- Protected endpoints require `X-API-Key` header
- Frontend stores the key in localStorage

## Testing

Run tests:

```bash
npm test
```

## Troubleshooting

### Local dev server won't start
- Check if port 3000 is available
- Verify all environment variables are set in `.env`
- Check Supabase credentials are correct

### Lambda function errors
- Check CloudWatch logs in AWS Console
- Verify environment variables are set in AWS Lambda
- Check Supabase connection

### CORS issues
- Verify CORS settings in `serverless.yml`
- Check that frontend origin is whitelisted

