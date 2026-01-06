# Production Deployment Guide

This guide details the steps to deploy the QuixHR application (Backend & UI) to a production environment.

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local builds if needed)
- PostgreSQL Database
- Redis
- AWS SES Credentials (for email)

## 1. Backend Deployment

The backend is containerized using Docker.

### Environment Setup
Create a `.env` file in the `backend` directory (or use environment variables in your deployment platform). Reference `backend/.env.example`.

**Critical Variables:**
- `NODE_ENV=production`
- `DATABASE_URL`: Connection string to your production PostgreSQL DB.
- `REDIS_HOST`, `REDIS_PORT`: Redis connection details.
- `JWT_SECRET`: **Must be strong and unique.**
- `CORS_ORIGIN`: Set to your UI domain (e.g., `https://app.quixhr.com`).

### Build & Run
The easiest way to run the entire backend stack (API, Database, Redis) is using the production Docker Compose file.

1.  Create a `.env` file in the root directory (where `docker-compose.prod.yml` is) to store secrets.
    ```env
    POSTGRES_USER=myuser
    POSTGRES_PASSWORD=mypassword
    POSTGRES_DB=quixhr
    JWT_SECRET=mysecurejwtsecret
    # ... add other AWS/Email secrets here
    ```

2.  Run the stack:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

This will:
- Start PostgreSQL and Redis (with data persistence).
- Build the optimized backend image.
- Start the backend connected to the DB and Redis.

### Database Migration
After starting the containers, run migrations:
```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## 2. UI Deployment (Static Export)

The UI is configured for static export (`output: 'export'` in `next.config.ts`).

### Build
Run the build command to generate the static files.

```bash
cd ui
# Install dependencies
npm install

# Build the application
npm run build
```

The output will be in the `ui/out` directory.

### Serving the UI
You can serve the contents of the `out` directory using any static file server or CDN.
- **Nginx/Apache**: Copy `out` folder content to your web root (e.g., `/var/www/html`).
- **Vercel/Netlify**: Point the build output directory to `out`.
- **S3 + CloudFront**: Upload `out` content to an S3 bucket and serve via CloudFront.

**Nginx Example Config:**
```nginx
server {
    listen 80;
    server_name app.quixhr.com;
    root /var/www/quixhr/ui/out;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }
}
```

## 3. Verification
1.  Access the UI domain. It should load.
2.  Try logging in. If the backend is correctly configured and CORS is set up, it should work.
3.  Check backend logs for any connection errors (DB, Redis).
