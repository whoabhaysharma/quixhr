# Leave Application Backend

A Node.js and Express-based REST API for managing leave applications, built with TypeScript, PostgreSQL, and Prisma ORM.

## Features

- User authentication (register, login)
- Leave request management
- Leave approval workflow
- Role-based access control (Admin, Manager, Employee)
- PostgreSQL database with Prisma ORM
- Input validation with Joi
- JWT-based authentication
- Comprehensive error handling
- CORS support

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 12
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL connection string and other configuration.

4. **Set up the database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

## Usage

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Leave Management
- `POST /api/leaves` - Create a leave request (protected)
- `GET /api/leaves` - Get user's leave requests (protected)
- `GET /api/leaves/:id` - Get leave details (protected)
- `PUT /api/leaves/:id` - Update leave request (protected)
- `DELETE /api/leaves/:id` - Delete leave request (protected)

### Approvals
- `POST /api/approvals/:leaveId` - Create approval (protected)
- `GET /api/approvals/:id` - Get approval details (protected)
- `GET /api/approvals/leaves/:leaveId` - Get leave approvals (protected)
- `PUT /api/approvals/:id` - Update approval status (protected)
- `GET /api/approvals/pending` - Get pending approvals (protected)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── dist/                # Compiled JavaScript (generated)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── .env.example         # Environment variables template
```

## Database Schema

The application includes the following models:

- **User** - Stores user information with roles (ADMIN, MANAGER, EMPLOYEE)
- **Leave** - Stores leave requests with status tracking
- **Approval** - Manages the approval workflow for leave requests

## Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (interactive database explorer)
npm run prisma:studio

# Push schema changes without migrations
npm run prisma:push

# Reset database (careful: deletes all data)
npm run prisma:reset
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Validation

Request validation is handled using Joi schemas. Invalid requests will return a 400 status code with detailed error messages.

## Error Handling

The API provides consistent error responses with appropriate HTTP status codes and error messages.

## Development Tools

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`

## Environment Variables

See `.env.example` for all available configuration options.

## License

ISC
